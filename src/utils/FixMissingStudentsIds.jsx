const fixMissingStudentIds = async () => {
    try {
      const studentsSnap = await getDocs(collection(db, 'students'));
      const resultsSnap = await getDocs(collection(db, 'examResults'));
  
      const students = studentsSnap.docs.map(doc => doc.data());
  
      let updatedCount = 0;
  
      for (const resultDoc of resultsSnap.docs) {
        const resultData = resultDoc.data();
  
        // Skip if studentId already exists
        if (resultData.studentId) continue;
  
        const match = students.find(s => s.name === resultData.name);
        if (match) {
          await updateDoc(doc(db, 'examResults', resultDoc.id), {
            studentId: match.studentId
          });
          console.log(`✅ Updated ${resultData.name} with studentId: ${match.studentId}`);
          updatedCount++;
        } else {
          console.warn(`⚠️ No matching student found for result: ${resultData.name}`);
        }
      }
  
      alert(`✅ Updated ${updatedCount} exam result(s) with missing studentId.`);
    } catch (err) {
      console.error('❌ Error updating studentIds in examResults:', err);
      alert('Failed to update missing student IDs.');
    }
  };
  

  <button
  onClick={fixMissingStudentIds}
  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
>
  Fix Missing studentId
</button>