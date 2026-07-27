import { db, collection, getDocs } from "../lib/firebase";

async function listLoans() {
  const querySnapshot = await getDocs(collection(db, "loans"));
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id} =>`, doc.data());
  });
}

listLoans();
