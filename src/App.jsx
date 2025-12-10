// src/App.jsx
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";

// 🔴 COLE AQUI OS DADOS DO SEU FIREBASE
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState("");
  const [obras, setObras] = useState([]);
  const [novaObra, setNovaObra] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "obras"), (snapshot) => {
      const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setObras(lista);
    });
    return () => unsub();
  }, []);

  const adicionarObra = async () => {
    if (!novaObra.trim()) return;
    await addDoc(collection(db, "obras"), { nome: novaObra, atividades: [] });
    setNovaObra("");
  };

  const removerObra = async (id) => {
    await deleteDoc(doc(db, "obras", id));
  };

  const adicionarAtividade = async (obra, texto) => {
    if (!texto.trim() || !user) return;
    const novaAtividade = { id: Date.now(), texto, concluida: false, autor: user };
    await updateDoc(doc(db, "obras", obra.id), {
      atividades: [...(obra.atividades || []), novaAtividade]
    });
  };

  const alternarAtividade = async (obra, atvId) => {
    const novas = (obra.atividades || []).map((a) =>
      a.id === atvId ? { ...a, concluida: !a.concluida } : a
    );
    await updateDoc(doc(db, "obras", obra.id), { atividades: novas });
  };

  const progresso = (atividades = []) => {
    if (atividades.length === 0) return 0;
    const concluidas = atividades.filter((a) => a.concluida).length;
    return Math.round((concluidas / atividades.length) * 100);
  };

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Quem está acessando?</h2>
        <input placeholder="Seu nome" onChange={(e) => setUser(e.target.value)} />
        <button onClick={() => user && setUser(user)}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Controle de Obras</h1>

      <input
        placeholder="Nome da nova obra"
        value={novaObra}
        onChange={(e) => setNovaObra(e.target.value)}
      />
      <button onClick={adicionarObra}>Adicionar Obra</button>

      {obras.map((obra) => {
        const pct = progresso(obra.atividades);

        return (
          <div key={obra.id} style={{ border: "1px solid #000", marginTop: 20, padding: 10 }}>
            <h3>{obra.nome}</h3>
            <p>Progresso: {pct}%</p>

            {(obra.atividades || []).map((a) => (
              <div key={a.id}>
                <input
                  type="checkbox"
                  checked={a.concluida}
                  onChange={() => alternarAtividade(obra, a.id)}
                />
                {a.texto} — {a.autor}
              </div>
            ))}

            <input
              placeholder="Nova atividade"
              onChange={(e) => (obra.nova = e.target.value)}
            />
            <button onClick={() => adicionarAtividade(obra, obra.nova || "")}>
              Adicionar Atividade
            </button>

            <br />
            <button onClick={() => removerObra(obra.id)}>Excluir Obra</button>
          </div>
        );
      })}
    </div>
  );
}
