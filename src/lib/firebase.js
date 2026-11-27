import { initializeApp } from 'firebase/app'
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, connectAuthEmulator, signInWithCredential, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore/lite'

// Configuração pública do app web (não é segredo; a proteção está em firestore.rules).
const firebaseConfig = {
  apiKey: 'AIzaSyDuE7XA7HaKzdoESHuYjJowoCrGPxi-Trc',
  authDomain: 'oquevairolar-b0129.firebaseapp.com',
  projectId: 'oquevairolar-b0129',
  storageBucket: 'oquevairolar-b0129.firebasestorage.app',
  messagingSenderId: '79379680736',
  appId: '1:79379680736:web:dcd7e4b425071c912d2f85',
}

export const app = initializeApp(firebaseConfig)
// Sem o "popupRedirectResolver" aqui: o getAuth() padrão já baixa, no celular, a janela escondida do Google
// (iframe + scripts) ao abrir o site, mesmo para quem nunca vai entrar. Ela só carrega quando a pessoa toca em "Entrar".
export const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })
export const db = getFirestore(app)

// UID da conta admin (Firebase > Authentication > Users). Mesmo valor de firestore.rules.
export const ADMIN_UIDS = ['1rDi2JoNIuNa7ssJ8uP6YnmxSaI2']
// Contas Google que também são admin (e-mail verificado). Mesmo valor de firestore.rules.
export const ADMIN_EMAILS = ['luisfmrtns@gmail.com']
export const ehAdmin = (u) => !!u && (ADMIN_UIDS.includes(u.uid) || (u.emailVerified && ADMIN_EMAILS.includes((u.email || '').toLowerCase())))

// Só em desenvolvimento: ?emu na URL usa os emuladores locais (para testar contas e amigos sem mexer no banco real).
if (import.meta.env.DEV && /[?&]emu/.test(location.search)) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  // Entrar como uma conta Google de teste: __entrarTeste({ sub, name, email, picture })
  window.__entrarTeste = (c) => signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ email_verified: true, ...c })))
}
