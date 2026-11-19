import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
export const auth = getAuth(app)
export const db = getFirestore(app)

// UID da conta admin (Firebase > Authentication > Users). Mesmo valor de firestore.rules.
export const ADMIN_UIDS = ['1rDi2JoNIuNa7ssJ8uP6YnmxSaI2']
// Contas Google que também são admin (e-mail verificado). Mesmo valor de firestore.rules.
export const ADMIN_EMAILS = ['luisfmrtns@gmail.com']
export const ehAdmin = (u) => !!u && (ADMIN_UIDS.includes(u.uid) || (u.emailVerified && ADMIN_EMAILS.includes((u.email || '').toLowerCase())))
