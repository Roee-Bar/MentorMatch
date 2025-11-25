'use client';

// app/admin/seed/page.tsx
// Visit this page ONCE to populate your database with test data
// URL: http://localhost:3000/admin/seed

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { adminUsers, supervisorUsers, studentUsers, sampleApplications, TEST_PASSWORD } from '@/lib/seed-data';

interface SeedResult {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function SeedPage() {
  const [results, setResults] = useState<SeedResult[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const addResult = (type: SeedResult['type'], message: string) => {
    setResults((prev) => [...prev, { type, message }]);
  };

  const clearCollection = async (collectionName: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return querySnapshot.size;
    } catch (error) {
      console.error(`Error clearing ${collectionName}:`, error);
      return 0;
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to clear ALL data from the database? This cannot be undone!')) {
      return;
    }

    setIsClearing(true);
    setResults([]);
    addResult('info', 'Starting database cleanup...');

    try {
      const collections = ['users', 'students', 'supervisors', 'admins', 'applications', 'projects'];
      
      for (const coll of collections) {
        const count = await clearCollection(coll);
        addResult('success', `Cleared ${count} documents from '${coll}' collection`);
      }

      addResult('success', 'Database cleared successfully!');
      addResult('info', 'Note: Firebase Auth accounts must be deleted manually from Firebase Console');
    } catch (error: any) {
      addResult('error', `Error: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm('This will create test accounts and data. Continue?')) {
      return;
    }

    setIsSeeding(true);
    setResults([]);
    addResult('info', 'Starting database seeding...');

    const createdUserIds: { [email: string]: string } = {};

    try {
      // ========================================
      // SEED ADMINS
      // ========================================
      addResult('info', 'Creating admin accounts...');
      
      for (const adminData of adminUsers) {
        try {
          // Create Firebase Auth account
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            adminData.auth.email,
            adminData.auth.password
          );
          const userId = userCredential.user.uid;
          createdUserIds[adminData.auth.email] = userId;

          // Create user document
          await setDoc(doc(db, 'users', userId), {
            ...adminData.user,
            
            createdAt: new Date(),
          });

          // Create admin document
          await setDoc(doc(db, 'admins', userId), {
            ...adminData.admin,
            
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          addResult('success', `Created admin: ${adminData.user.name}`);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            addResult('info', `Admin already exists: ${adminData.auth.email}`);
          } else {
            addResult('error', `Error creating admin ${adminData.auth.email}: ${error.message}`);
          }
        }
      }

      // ========================================
      // SEED SUPERVISORS
      // ========================================
      addResult('info', 'Creating supervisor accounts...');
      
      for (const supervisorData of supervisorUsers) {
        try {
          // Create Firebase Auth account
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            supervisorData.auth.email,
            supervisorData.auth.password
          );
          const userId = userCredential.user.uid;
          createdUserIds[supervisorData.auth.email] = userId;

          // Create user document
          await setDoc(doc(db, 'users', userId), {
            ...supervisorData.user,
            
            createdAt: new Date(),
          });

          // Create supervisor document
          await setDoc(doc(db, 'supervisors', userId), {
            ...supervisorData.supervisor,
            
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          addResult('success', `Created supervisor: ${supervisorData.user.name}`);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            addResult('info', `Supervisor already exists: ${supervisorData.auth.email}`);
          } else {
            addResult('error', `Error creating supervisor ${supervisorData.auth.email}: ${error.message}`);
          }
        }
      }

      // ========================================
      // SEED STUDENTS
      // ========================================
      addResult('info', 'Creating student accounts...');
      
      for (const studentData of studentUsers) {
        try {
          // Create Firebase Auth account
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            studentData.auth.email,
            studentData.auth.password
          );
          const userId = userCredential.user.uid;
          createdUserIds[studentData.auth.email] = userId;

          // Create user document
          await setDoc(doc(db, 'users', userId), {
            ...studentData.user,
            
            createdAt: new Date(),
          });

          // Update student data with supervisor ID if matched (Eldar & Roee are matched with Julia)
          const studentDoc = { ...studentData.student };
          if (studentData.student.matchStatus === 'matched' && createdUserIds['julia.sheidin@braude.ac.il']) {
            studentDoc.assignedSupervisorId = createdUserIds['julia.sheidin@braude.ac.il'];
          }

          // Create student document
          await setDoc(doc(db, 'students', userId), {
            ...studentDoc,
            
            registrationDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          addResult('success', `Created student: ${studentData.user.name}`);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            addResult('info', `Student already exists: ${studentData.auth.email}`);
          } else {
            addResult('error', `Error creating student ${studentData.auth.email}: ${error.message}`);
          }
        }
      }

      // ========================================
      // SEED SAMPLE APPLICATIONS
      // ========================================
      addResult('info', 'Creating sample applications...');
      
      const sarahId = createdUserIds['sarah.cohen@e.braude.ac.il'];
      const israelId = createdUserIds['israel.israeli@braude.ac.il'];
      const naomiId = createdUserIds['naomi.unkelos@braude.ac.il'];

      if (sarahId && (israelId || naomiId)) {
        for (let i = 0; i < sampleApplications.length; i++) {
          const appData = { ...sampleApplications[i] };
          appData.studentId = sarahId;
          
          if (i === 0 && israelId) {
            appData.supervisorId = israelId;
          } else if (i === 1 && naomiId) {
            appData.supervisorId = naomiId;
          }

          if (appData.supervisorId) {
            const appRef = doc(collection(db, 'applications'));
            await setDoc(appRef, {
              ...appData,
              id: appRef.id,
              dateApplied: new Date(),
              lastUpdated: new Date(),
            });
            addResult('success', `Created application: ${appData.projectTitle}`);
          }
        }
      }

      // ========================================
      // SEED A SAMPLE PROJECT (MentorMatch itself!)
      // ========================================
      addResult('info', 'Creating sample project...');
      
      const eldarId = createdUserIds['eldar.gafarov@e.braude.ac.il'];
      const roeeId = createdUserIds['roee.bar@e.braude.ac.il'];
      const juliaId = createdUserIds['julia.sheidin@braude.ac.il'];

      if (eldarId && roeeId && juliaId) {
        const projectRef = doc(collection(db, 'projects'));
        await setDoc(projectRef, {
          id: projectRef.id,
          projectCode: '25-2-D-7',
          studentIds: [eldarId, roeeId],
          studentNames: ['Eldar Gafarov', 'Roee Bar'],
          supervisorId: juliaId,
          supervisorName: 'Dr. Julia Sheidin',
          title: 'MentorMatch: Final Projects Portal',
          description: 'A platform for matching students with supervisors for capstone projects at Braude College.',
          status: 'in_progress',
          phase: 'A',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        addResult('success', 'Created project: MentorMatch');
      }

      addResult('success', 'Database seeding completed successfully!');
      addResult('info', `All accounts use password: ${TEST_PASSWORD}`);

    } catch (error: any) {
      addResult('error', `Fatal error: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Database Seeder</h1>
          <p className="text-gray-600 mb-6">
            Use this page to populate your Firebase database with test data.
          </p>

          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">Important Notes:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Run the seed only ONCE on a fresh database</li>
              <li>• All test accounts will use password: <code className="bg-yellow-100 px-1 rounded">{TEST_PASSWORD}</code></li>
              <li>• This creates: 1 admin, 3 supervisors, 5 students</li>
              <li>• Make sure your Firebase project is properly configured</li>
            </ul>
          </div>

          {/* Test Accounts Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-800 mb-2">Test Account Emails:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-blue-700">Admin:</p>
                <p className="text-blue-600">julia.sheidin@braude.ac.il</p>
              </div>
              <div>
                <p className="font-semibold text-blue-700">Supervisors:</p>
                <p className="text-blue-600">naomi.unkelos@braude.ac.il</p>
                <p className="text-blue-600">israel.israeli@braude.ac.il</p>
                <p className="text-blue-600">anat.dahan@braude.ac.il</p>
              </div>
              <div>
                <p className="font-semibold text-blue-700">Students:</p>
                <p className="text-blue-600">eldar.gafarov@e.braude.ac.il</p>
                <p className="text-blue-600">roee.bar@e.braude.ac.il</p>
                <p className="text-blue-600">sarah.cohen@e.braude.ac.il</p>
                <p className="text-blue-600">david.levy@e.braude.ac.il</p>
                <p className="text-blue-600">maya.levi@e.braude.ac.il</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding || isClearing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSeeding ? 'Seeding...' : 'Seed Database'}
            </button>
            
            <button
              onClick={handleClearDatabase}
              disabled={isSeeding || isClearing}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isClearing ? 'Clearing...' : 'Clear Database'}
            </button>
          </div>

          {/* Results Log */}
          {results.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="text-white font-bold mb-3">Results Log:</h3>
              <div className="space-y-1 font-mono text-sm">
                {results.map((result, index) => (
                  <p
                    key={index}
                    className={`${
                      result.type === 'success'
                        ? 'text-green-400'
                        : result.type === 'error'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {result.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}