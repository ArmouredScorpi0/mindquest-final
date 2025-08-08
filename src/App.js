import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Smile, Frown, Meh, Laugh, Angry, Home, LayoutDashboard, BookText, X, PlusCircle, ChevronDown, ChevronUp, MoreVertical, Edit, Trash2, Map, Shield, Zap, Wind, ArrowLeft, Dumbbell, Lock, Star, CheckCircle, ClipboardCheck, Droplets, Sparkles } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- IMPORTANT ---
// PASTE YOUR FIREBASE CONFIG OBJECT HERE
// You copied this from the Firebase console in Part 1 of the guide.
const firebaseConfig = {
  apiKey: "AIzaSyDirGCKSHEy8UuYT07lZVqVQl8y1RKjb7M",
  authDomain: "mindquest-8eff3.firebaseapp.com",
  projectId: "mindquest-8eff3",
  storageBucket: "mindquest-8eff3.firebasestorage.app",
  messagingSenderId: "591292470550",
  appId: "1:591292470550:web:efec5a99c6dd54e7cbec37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// We get the appId from your config object now.
const appId = firebaseConfig.appId || 'default-mindquest-app';

// --- App Constants ---

const avatars = [
    { id: 1, name: 'Whispering Woods', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1956&auto=format&fit=crop' },
    { id: 2, name: 'Harmony Valley', url: 'https://images.unsplash.com/photo-1509099395498-a26c959ba0b7?q=80&w=1960&auto=format&fit=crop' },
    { id: 3, name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1976&auto=format&fit=crop' },
    { id: 4, name: 'Golden Dunes', url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=2070&auto=format&fit=crop' },
];

const goals = [
    { id: 'resilience', name: 'Resilience', description: 'Build strength to navigate life\'s challenges.' },
    { id: 'focus', name: 'Focus', description: 'Sharpen your concentration and be more present.' },
    { id: 'positivity', name: 'Positivity', description: 'Cultivate a more optimistic and grateful outlook.' },
];

const moods = [
    { value: 5, icon: Laugh, color: 'text-green-400', prompt: "Fantastic! What's putting a smile on your face today?", label: 'Fantastic' },
    { value: 4, icon: Smile, color: 'text-blue-400', prompt: "Glad to see you're feeling good. Want to write about it?", label: 'Good' },
    { value: 3, icon: Meh, color: 'text-indigo-400', prompt: "Feeling neutral is perfectly okay. What's on your mind?", label: 'Neutral' },
    { value: 2, icon: Frown, color: 'text-purple-400', prompt: "It's okay to feel down. What's contributing to this feeling?", label: 'Down' },
    { value: 1, icon: Angry, color: 'text-red-500', prompt: "It's valid to feel this way. Writing about it might help.", label: 'Angry' },
];

const mapNodesData = [
    // Resilience Path
    { id: 'r1', name: "Steadfast Stone", path: "resilience", position: { top: '10%', left: '50%' } },
    { id: 'r2', name: "Grit Grove", path: "resilience", position: { top: '25%', left: '30%' } },
    { id: 'r3', name: "Unbending Mountain", path: "resilience", position: { top: '40%', left: '70%' } },
    { id: 'r4', name: "Anchor Point", path: "resilience", position: { top: '55%', left: '40%' } },
    { id: 'r5', name: "The Summit of Self", path: "resilience", position: { top: '70%', left: '60%' } },
    { id: 'r6', name: "Resilient River", path: "resilience", position: { top: '85%', left: '30%' } },
    // Focus Path
    { id: 'f1', name: "Quiet Clearing", path: "focus", position: { top: '10%', left: '50%' } },
    { id: 'f2', name: "Concentration Creek", path: "focus", position: { top: '25%', left: '70%' } },
    { id: 'f3', name: "Mindful Monolith", path: "focus", position: { top: '40%', left: '30%' } },
    { id: 'f4', name: "The Focused Eye", path: "focus", position: { top: '55%', left: '60%' } },
    { id: 'f5', name: "Deep Work Depths", path: "focus", position: { top: '70%', left: '40%' } },
    { id: 'f6', name: "Clarity Peak", path: "focus", position: { top: '85%', left: '70%' } },
    // Positivity Path
    { id: 'p1', name: "Gratitude Gardens", path: "positivity", position: { top: '10%', left: '50%' } },
    { id: 'p2', name: "Sun-Kissed Summit", path: "positivity", position: { top: '25%', left: '30%' } },
    { id: 'p3', name: "Joyful Spring", path: "positivity", position: { top: '40%', left: '70%' } },
    { id: 'p4', name: "Kindness Meadow", path: "positivity", position: { top: '55%', left: '40%' } },
    { id: 'p5', name: "The Optimist's Outlook", path: "positivity", position: { top: '70%', left: '60%' } },
    { id: 'p6', name: "Serenity Shore", path: "positivity", position: { top: '85%', left: '30%' } },
];

// --- Global styles for map nodes from the sandbox ---
const nodePathStyles = {
    resilience: "bg-red-700/90 border-red-500",
    focus: "bg-indigo-500/80 border-indigo-300",
    positivity: "bg-amber-500/90 border-amber-300",
};

const lockedNodePathStyles = {
    resilience: "bg-red-900/90 border-red-700",
    focus: "bg-indigo-900/90 border-indigo-700",
    positivity: "bg-amber-700/90 border-amber-500",
};

const lineColors = {
    resilience: "#F87171", // red-400
    focus: "#818CF8", // indigo-400
    positivity: "#FBBF24", // amber-400
};

// --- Badge System ---
const badgesList = {
    quests: [
        { id: 'first_quest', name: 'First Quest', description: 'Complete your first Big Quest.', check: (data) => safeArray(data.completedNodes).length >= 1 },
        { id: 'pathfinder', name: 'Pathfinder', description: 'Complete 3 Big Quests.', check: (data) => safeArray(data.completedNodes).length >= 3 },
        { id: 'trailblazer', name: 'Trailblazer', description: 'Complete all nodes on your path.', check: (data) => safeArray(data.completedNodes).filter(n => !n.startsWith('fit')).length >= 6 },
    ],
    journaling: [
        { id: 'scribe', name: 'Scribe', description: 'Write your first journal entry.', check: (data) => safeArray(data.journal).length >= 1 },
        { id: 'diarist', name: 'Diarist', description: 'Write 5 journal entries.', check: (data) => safeArray(data.journal).length >= 5 },
        { id: 'storyteller', name: 'Storyteller', description: 'Write 15 journal entries.', check: (data) => safeArray(data.journal).length >= 15 },
    ],
    consistency: [
        { id: 'week_streak', name: 'Week Streak', description: 'Maintain a 7-day quest streak.', check: (data) => (data.streak || 0) >= 7 },
        { id: 'month_streak', name: 'Month Streak', description: 'Maintain a 30-day quest streak.', check: (data) => (data.streak || 0) >= 30 },
    ],
    fitness: [
        { id: 'first_steps', name: 'First Steps', description: 'Complete your first day of fitness challenges.', check: (data) => data.dailyFitness?.tasks.every(t => t.completed) },
        { id: 'energizer', name: 'Energizer', description: 'Complete fitness challenges 5 times.', check: (data) => (data.fitnessCompletions || 0) >= 5 },
    ]
};

const allBadges = Object.values(badgesList).flat();


const fitnessTasksPool = {
    level1: ["Complete 5 minutes of gentle, full-body stretching.", "Do 3 minutes of neck, shoulder, and wrist rolls."],
    level2: ["Perform 20 jumping jacks to get your heart rate up.", "Do 15 high knees on each side."],
    level3: ["Go for a 10-minute brisk walk, either outside or in place.", "Complete 3 sets of 10 bodyweight squats."],
    level4: ["Hold a 45-second plank to engage your core.", "Perform 2 sets of 8 push-ups (on knees if needed)."],
    level5: ["Follow a 5-minute cool-down stretch video.", "Practice 3 minutes of deep belly breathing to relax."]
};


// --- Utility Functions ---

const getMoodProps = (moodValue) => moods.find(m => m.value === moodValue);
const safeArray = (field) => Array.isArray(field) ? field : [];

// --- Contexts and Providers ---

const AuthContext = createContext(null);
const GameContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const signInUser = async () => {
            try {
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Anonymous sign-in failed:", error);
            }
        };
        signInUser();
        
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            let unsubscribeSnapshot = () => {};
            if (firebaseUser) {
                setUser(firebaseUser);
                const userRef = doc(db, 'artifacts', appId, 'users', firebaseUser.uid);
                
                unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
                    if (userSnap.exists()) {
                        setUserData({ ...userSnap.data(), journal: userSnap.data().journal || [] });
                    } else {
                        setUserData(null);
                    }
                    if (!isAuthReady) setIsAuthReady(true);
                }, (error) => {
                    console.error("Error with Firestore snapshot:", error);
                    if (!isAuthReady) setIsAuthReady(true);
                });
            } else {
                setUser(null);
                setUserData(null);
                if (!isAuthReady) setIsAuthReady(true);
            }
            return () => unsubscribeSnapshot();
        });

        return () => unsubscribeAuth();
    }, [isAuthReady]);

    const value = { user, userData, loading: !isAuthReady };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const GameProvider = ({ children }) => {
    const { user, userData } = useContext(AuthContext);
    const [isTasksLoading, setIsTasksLoading] = useState(true);
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [lastReward, setLastReward] = useState({ xp: 0, newBadges: [] });
    const [journalContext, setJournalContext] = useState({ source: 'quest', mood: null, prompt: '' });
    const [selectedJournalEntry, setSelectedJournalEntry] = useState(null);
    const [entryToEdit, setEntryToEdit] = useState(null);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [unlockedNodeInfo, setUnlockedNodeInfo] = useState(null);
    const [pathToAutoOpen, setPathToAutoOpen] = useState(null);
    const [modalState, setModalState] = useState({
        isJournalOpen: false,
        isJournalDetailOpen: false,
        isDeleteConfirmOpen: false,
        isEditConfirmOpen: false,
        showReward: false,
        showNodeUnlockModal: false,
        showFitnessUnlockModal: false,
        showFitnessCompleteModal: false,
    });

    const openModal = (modalName) => setModalState(prev => ({ ...prev, [modalName]: true }));
    const closeModal = (modalName) => setModalState(prev => ({ ...prev, [modalName]: false }));

    const openJournalDetail = (entry) => {
        setSelectedJournalEntry(entry);
        openModal('isJournalDetailOpen');
    };

    const openNewJournalEntry = () => {
        setEntryToEdit(null);
        setJournalContext({ source: 'journal', mood: null, prompt: 'What\'s on your mind?' });
        openModal('isJournalOpen');
    };
    
    const openEditJournal = (entry) => {
        if (entry.insights) {
            setEntryToEdit(entry);
            openModal('isEditConfirmOpen');
        } else {
            setEntryToEdit(entry);
            setJournalContext({ source: entry.source, mood: entry.mood });
            openModal('isJournalOpen');
        }
    };

    const confirmEditJournal = () => {
        if (!entryToEdit) return;
        setJournalContext({ source: entryToEdit.source, mood: entryToEdit.mood });
        closeModal('isEditConfirmOpen');
        openModal('isJournalOpen');
    };

    const closeJournalModal = () => {
        closeModal('isJournalOpen');
        setEntryToEdit(null);
    };

    const openDeleteConfirm = (entry) => {
        setEntryToDelete(entry);
        openModal('isDeleteConfirmOpen');
    };

    const generateDailyContent = async () => {
        if (!user || !userData) return;
        setIsTasksLoading(true);

        const completedTasksHistory = safeArray(userData.completedTasksHistory).slice(-14);
        const historyPrompt = completedTasksHistory.length > 0
            ? `To ensure variety, avoid generating tasks similar to these recent ones the user has completed:\n${completedTasksHistory.map(t => `- ${t}`).join('\n')}`
            : "This is the user's first day, so provide a welcoming set of tasks.";

        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
        const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
        const contextPrompt = `Today is ${dayOfWeek}, ${today.toISOString().split('T')[0]}. It is a ${isWeekend ? 'weekend' : 'weekday'}.`;

        const prompt = `
            You are MindQuest, a calm and thoughtful companion for the user's wellness journey. Your voice is genuine and encouraging—easygoing and supportive, never forced or overly sentimental. Speak directly to the user as a friendly guide.
            **User's Main Path:** ${userData.mainPath}
            **Today's Context:** ${contextPrompt}
            **User's Recent Task History (avoid repeating these ideas/verbs):**
            ${historyPrompt}
            **Your Mission:**
            Generate a JSON object containing three unique small daily tasks and one larger "Big Quest". Frame these as gentle invitations, not commands.
            **Requirements:**
            1.  **Daily Tasks (3 total):**
                - One for **Resilience**: A small action for emotional strength or coping.
                - One for **Focus**: An idea for clarity, concentration, or presence.
                - One for **Positivity**: A simple way to invite gratitude, kindness, or uplifting perspective.
                - **Exactly one** must be a journaling task. Journaling prompts should feel reflective and open-ended, not cliché.
            2.  **Big Quest (1 total):**
                - A 5–15 minute activity connected to the user's main path (**${userData.mainPath}**). 
                - It should feel like a mini highlight of their day—a creative, exploratory, or meaningful action that goes beyond just “more time spent.”
                - Avoid making it just a longer version of a daily task; instead, give it a slightly different purpose or angle.
            3.  **Tone & Style:**
                - Use warm, easy language. Think invitations like: "Maybe explore…", "How about giving this a try…", "You could take a few minutes for…".
                - Include a subtle “why” behind each task (e.g., “…to steady yourself after a busy day”).
                - Vary the nature of tasks (mental, physical, creative, or social). Avoid overused terms like “mindfully”, “moment”, “center yourself”.
                - Keep tasks concise (1–2 sentences max).
            4.  **Strict Output Format:**
                - Respond ONLY with a valid JSON object. No extra commentary.
            **JSON Structure:**
            {
              "daily_tasks": [
                {"category": "Resilience", "task": "string", "isJournaling": boolean},
                {"category": "Focus", "task": "string", "isJournaling": boolean},
                {"category": "Positivity", "task": "string", "isJournaling": boolean}
              ],
              "big_quest": {
                "path": "${userData.mainPath}",
                "task": "string"
              }
            }
        `;
        
        try {
            const response = await fetch('/api/generateAIContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            const generatedText = data.result?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) throw new Error("No text generated from API.");

            let parsedJson;
            try {
                const cleanedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedJson = JSON.parse(cleanedText);
            } catch (e) {
                console.error("Initial JSON parsing failed. Original text:", generatedText);
                throw new Error("Could not parse the JSON response from the AI.");
            }
            
            if (parsedJson && parsedJson.daily_tasks && parsedJson.big_quest) {
                const newTasks = parsedJson.daily_tasks.map((task) => ({ 
                    ...task, 
                    id: crypto.randomUUID(), 
                    completed: false 
                }));

                const todayStr = new Date().toISOString().split('T')[0];
                const newDailyContent = {
                    date: todayStr,
                    tasks: newTasks,
                    bigQuest: parsedJson.big_quest,
                    allSmallTasksCompleted: false,
                };
                
                const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
                await setDoc(userRef, { dailyContent: newDailyContent }, { merge: true });
            } else {
                throw new Error("Generated JSON is missing required fields.");
            }

        } catch (error) {
            console.error("Failed to generate or process daily content, using fallback:", error);
            toast.error("The spirits are quiet... Here are some challenges.", { duration: 4000 });
            
            const fallbackTasks = [
                { id: crypto.randomUUID(), category: 'Resilience', task: 'Take a quiet moment to write one worry you’ve been holding and how you might ease it.', isJournaling: true, completed: false },
                { id: crypto.randomUUID(), category: 'Focus', task: 'Clear one small area of your workspace to make room for focus.', isJournaling: false, completed: false },
                { id: crypto.randomUUID(), category: 'Positivity', task: 'List two moments from this week that brought you joy, no matter how small.', isJournaling: false, completed: false },
            ];
            const fallbackBigQuest = { path: userData.mainPath, task: "Spend 10 minutes organizing or simplifying one part of your digital life (like clearing old files or sorting bookmarks), then note how it felt."};

            const todayStr = new Date().toISOString().split('T')[0];
            const fallbackContent = {
                date: todayStr,
                tasks: fallbackTasks,
                bigQuest: fallbackBigQuest,
                allSmallTasksCompleted: false,
            };
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await setDoc(userRef, { dailyContent: fallbackContent }, { merge: true });
        } finally {
            setIsTasksLoading(false);
        }
    };
    
    const generateFallbackFitnessTasks = () => {
        const tasks = Object.keys(fitnessTasksPool).map((levelKey, index) => {
            const pool = fitnessTasksPool[levelKey];
            const randomIndex = Math.floor(Math.random() * pool.length);
            return {
                id: crypto.randomUUID(),
                text: pool[randomIndex],
                completed: false,
                level: index + 1
            };
        });
        return tasks;
    };
    
    const generateDailyFitnessTasksAI = async () => {
        const prompt = `
            You are a supportive and encouraging fitness guide. Generate a JSON object containing five distinct, short fitness tasks for a user's daily challenge.
            **Requirements:**
            1.  **Five Tasks Total:** Create exactly five tasks.
            2.  **Escalating Intensity:** The tasks must progress logically in intensity:
                - **Level 1:** A very gentle warm-up or mobility exercise (e.g., stretching, neck rolls).
                - **Level 2:** A light cardio warm-up to raise the heart rate (e.g., jumping jacks, high knees).
                - **Level 3:** A moderate main exercise (e.g., brisk walk, bodyweight squats).
                - **Level 4:** A slightly more intense strength or core exercise (e.g., plank, push-ups).
                - **Level 5:** A cool-down or breathing exercise (e.g., cool-down stretches, deep breathing).
            3.  **Clarity & Brevity:** Each task description must be a single, clear, and actionable sentence.
            4.  **Variety:** Do not repeat the exact same exercises every day.
            5.  **Strict Output Format:** Respond ONLY with a valid JSON object. No commentary.
            **JSON Structure:**
            {
              "fitness_tasks": [
                {"level": 1, "task": "string"},
                {"level": 2, "task": "string"},
                {"level": 3, "task": "string"},
                {"level": 4, "task": "string"},
                {"level": 5, "task": "string"}
              ]
            }
        `;

        try {
            const response = await fetch('/api/generateAIContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            const generatedText = data.result?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) throw new Error("No text generated from API.");
            
            let parsedJson;
            try {
                const cleanedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedJson = JSON.parse(cleanedText);
            } catch (e) {
                console.error("Initial JSON parsing failed. Original text:", generatedText);
                throw new Error("Could not parse the JSON response from the AI.");
            }
            
            if (parsedJson && parsedJson.fitness_tasks && parsedJson.fitness_tasks.length === 5) {
                const newTasks = parsedJson.fitness_tasks.map((task) => ({ 
                    id: crypto.randomUUID(),
                    text: task.task,
                    completed: false,
                    level: task.level
                }));
                return newTasks;
            } else {
                throw new Error("Generated JSON for fitness tasks is invalid.");
            }

        } catch (error) {
            console.error("Failed to generate AI fitness tasks, using fallback:", error);
            toast.error("Couldn't generate new exercises, using a classic routine!", { duration: 3000 });
            return generateFallbackFitnessTasks();
        }
    };

    const logWaterIntake = async (isSilent = false) => {
        if (!user || !userData) return;
        const currentLevel = userData.hydration?.level || 0;
        if (currentLevel >= 8) {
            if (!isSilent) {
                toast('You\'ve already reached your goal for today!', { icon: '🎉' });
            }
            return;
        }

        const newLevel = currentLevel + 1;
        let updates = { 'hydration.level': newLevel };
        let xpGained = 0;

        if (newLevel === 8) {
            xpGained = 20;
            const updatedData = addXp(xpGained, userData);
            updates.xp = updatedData.xp;
            updates.level = updatedData.level;
            toast.success('Hydration goal complete! +20 XP');
        }

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, updates);
        } catch (error) {
            console.error("Error logging water intake:", error);
            toast.error("Could not save hydration progress.");
        }
    };

    const handleDailyTasksCompletion = async (tasks) => {
        const allCompleted = tasks.every(t => t.completed);
        if (allCompleted) {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            
            const completedTaskTexts = tasks.map(t => t.task);
            const updatedHistory = [...safeArray(userData.completedTasksHistory), ...completedTaskTexts].slice(-50);

            const userMainPath = userData.mainPath;
            const pathNodes = mapNodesData.filter(node => node.path === userMainPath);
            const currentUnlocked = safeArray(userData.unlockedNodes).filter(nodeId => !nodeId.startsWith('fit'));
            let updatedUnlockedNodes = [...safeArray(userData.unlockedNodes)];

            if (currentUnlocked.length < pathNodes.length) {
                const newlyUnlockedNode = pathNodes[currentUnlocked.length];
                updatedUnlockedNodes = [...updatedUnlockedNodes, newlyUnlockedNode.id];
                setUnlockedNodeInfo({ path: newlyUnlockedNode.path, id: newlyUnlockedNode.id });
                openModal('showNodeUnlockModal');
            }
            
            try {
                await updateDoc(userRef, { 
                    'dailyContent.allSmallTasksCompleted': true,
                    completedTasksHistory: updatedHistory,
                    unlockedNodes: updatedUnlockedNodes
                });
                toast.success("All small tasks complete! Your Big Quest on the map is unlocked!");
                
                if (userData.hydration?.level < 8) {
                    toast("Hydration Boost! +1 glass of water.", { icon: '✨' });
                    await logWaterIntake(true);
                }

            } catch (error) {
                console.error("Error updating daily tasks completion:", error);
                toast.error("Could not save your progress. Please try again.");
            }
        }
    };

    useEffect(() => {
        const setupDailyData = async () => {
            if (userData && user) {
                const todayStr = new Date().toISOString().split('T')[0];
                const userContentData = userData.dailyContent;
                const userFitnessData = userData.dailyFitness;

                if (!userContentData || userContentData.date !== todayStr) {
                    await generateDailyContent();
                } else {
                    setIsTasksLoading(false);
                }

                if (!userFitnessData || userFitnessData.date !== todayStr) {
                    const newFitnessTasks = await generateDailyFitnessTasksAI();
                    const newFitnessData = { date: todayStr, tasks: newFitnessTasks };
                    const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
                    await setDoc(userRef, { dailyFitness: newFitnessData }, { merge: true });
                }
            }
        };
        setupDailyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userData]); 
    
    const getXpForNextLevel = (level) => {
        if (level <= 0) return 0;
        const baseXP = 200;
        const increment = 20;
        return (level / 2) * (2 * baseXP + (level - 1) * increment);
    };

    const addXp = (amount, currentData) => {
        const currentLevel = currentData.level || 1;
        const currentXp = currentData.xp || 0;
        
        const newTotalXp = currentXp + amount;
        let newLevel = currentLevel;
        
        let xpForNext = getXpForNextLevel(newLevel);
        
        while (newTotalXp >= xpForNext) {
            newLevel++;
            xpForNext = getXpForNextLevel(newLevel);
        }

        return { ...currentData, xp: newTotalXp, level: newLevel };
    };
    
    const checkForNewBadges = (currentData) => {
        const currentBadges = safeArray(currentData.badges);
        const newBadges = [];
        allBadges.forEach(badge => {
            if (!currentBadges.includes(badge.id) && badge.check(currentData)) {
                newBadges.push(badge.id);
            }
        });
        return newBadges;
    };

    const completeSimpleTask = async (taskId) => {
        if (!user || !userData || !userData.dailyContent) return;
        
        const updatedTasks = userData.dailyContent.tasks.map(task => 
            task.id === taskId ? { ...task, completed: true } : task
        );
        const updatedDailyContent = { ...userData.dailyContent, tasks: updatedTasks };
        
        let updatedData = { ...userData, dailyContent: updatedDailyContent };
        updatedData = addXp(10, updatedData);

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { 
                dailyContent: updatedDailyContent,
                xp: updatedData.xp,
                level: updatedData.level
            });
            toast.success("Task Complete! +10 XP");
            handleDailyTasksCompletion(updatedTasks);
        } catch (error) {
            console.error("Error completing simple task:", error);
            toast.error("Failed to save task completion.");
        }
    };

    const completeJournalingTask = async (task, journalText) => {
        if (!user || !userData || !userData.dailyContent || !task || !journalText) return;

        const newJournalEntry = { 
            id: crypto.randomUUID(), date: new Date().toISOString(), entry: journalText, 
            source: 'task', taskText: task.task, path: task.category.toLowerCase()
        };
        const updatedJournal = [newJournalEntry, ...safeArray(userData.journal)];

        const updatedTasks = userData.dailyContent.tasks.map(t => 
            t.id === task.id ? { ...t, completed: true } : t
        );
        const updatedDailyContent = { ...userData.dailyContent, tasks: updatedTasks };
        
        let updatedData = { ...userData, journal: updatedJournal, dailyContent: updatedDailyContent };
        updatedData = addXp(10, updatedData);

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { 
                journal: updatedJournal,
                dailyContent: updatedDailyContent,
                xp: updatedData.xp,
                level: updatedData.level
            });
            toast.success("Journal saved & task complete! +10 XP");
            handleDailyTasksCompletion(updatedTasks);
        } catch (error) {
            console.error("Error completing journaling task:", error);
            toast.error("Failed to save journal and task.");
        }
    };

    const completeNodeTask = async (node) => {
        if(!user || !userData || !userData.dailyContent?.bigQuest) return;
        
        const taskText = userData.dailyContent.bigQuest.task;
        
        let xpGained = 50;
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const newStreak = userData.lastQuestDate === yesterdayStr ? (userData.streak || 0) + 1 : 1;
        
        toast.success("Big Quest Complete! +50XP!");
        if (safeArray(userData.completedNodes).length === 0) {
            openModal('showFitnessUnlockModal');
        }
        
        const newCompletedNodes = [...safeArray(userData.completedNodes), node.id];
        
        const taskKey = `${node.id}-${todayStr}`;
        const newCompletedNodeTasks = { ...(userData.completedNodeTasks || {}), [taskKey]: taskText };

        let tempUpdatedData = { ...userData, completedNodes: newCompletedNodes, streak: newStreak };
        const newBadges = checkForNewBadges(tempUpdatedData);
        if (newBadges.length > 0) {
            const badgeBonusXp = newBadges.length * 25;
            xpGained += badgeBonusXp;
            toast.success(`Badge Unlocked! +${badgeBonusXp} bonus XP!`);
        }
        
        const updatedData = addXp(xpGained, tempUpdatedData);
        const updatedBadges = newBadges.length > 0 ? [...new Set([...safeArray(userData.badges), ...newBadges])] : userData.badges;

        if(xpGained > 0 || newBadges.length > 0) {
            setLastReward({ xp: xpGained, newBadges: newBadges.map(id => allBadges.find(b => b.id === id).name) });
            openModal('showReward');
        }

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { 
                xp: updatedData.xp, 
                level: updatedData.level, 
                completedNodes: newCompletedNodes,
                completedNodeTasks: newCompletedNodeTasks,
                streak: newStreak,
                lastQuestDate: todayStr,
                badges: updatedBadges,
            });
        } catch (error) {
            console.error("Error completing node task:", error);
            toast.error("Failed to save quest progress.");
        }
    };

    const recordMood = async (moodValue) => {
        if (!user || !userData) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const moodAlreadyLoggedToday = userData.lastMoodDate === todayStr;
        let updates = {};
        let xpGained = 0;

        if (!moodAlreadyLoggedToday) {
            xpGained = 5;
            const updatedData = addXp(xpGained, userData);
            updates.xp = updatedData.xp;
            updates.level = updatedData.level;
            updates.lastMoodDate = todayStr;
            toast.success('+5 XP for your check-in!', { duration: 3000 });
        }

        const moodProps = getMoodProps(moodValue);
        const openJournal = () => {
            setJournalContext({ source: 'mood', mood: moodValue, prompt: moodProps.prompt });
            openModal('isJournalOpen');
        };
        toast.custom((t) => (
            <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} className={`max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                <div className="flex-1 w-0 p-4"><p className="text-sm font-medium text-gray-900">{moodProps.prompt}</p></div>
                <div className="flex border-l border-gray-200"><button onClick={() => {toast.dismiss(t.id); openJournal();}} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">Journal</button></div>
            </motion.div>), {id: `mood-toast-${moodValue}`});
        
        let moodHistory = [...safeArray(userData.moodHistory)];
        const todayEntryIndex = moodHistory.findIndex(entry => entry.date.startsWith(todayStr));
        if (todayEntryIndex > -1) {
            moodHistory[todayEntryIndex] = { ...moodHistory[todayEntryIndex], mood: moodValue };
        } else {
            moodHistory.unshift({ date: new Date().toISOString(), mood: moodValue });
        }
        moodHistory.sort((a,b) => new Date(b.date) - new Date(a.date));
        updates.moodHistory = moodHistory.slice(0, 30);
        
        const newBadges = checkForNewBadges({ ...userData, ...updates });
        if(newBadges.length > 0) {
            updates.badges = [...new Set([...safeArray(userData.badges), ...newBadges])];
        }
        if (xpGained > 0 || newBadges.length > 0) {
            setLastReward({ xp: xpGained, newBadges: newBadges.map(id => allBadges.find(b => b.id === id).name) });
            openModal('showReward');
        }
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, updates);
        } catch (error) {
            console.error("Error recording mood:", error);
            toast.error("Could not save your mood.");
        }
    };

    const saveJournalEntry = async (entry, context) => {
        if (!user || !userData || !entry.trim()) {
            toast.error("Journal entry cannot be empty.");
            return;
        }
        const newJournalEntry = { id: crypto.randomUUID(), date: new Date().toISOString(), entry, source: context.source };
        if (context.source === 'mood') {
            newJournalEntry.mood = context.mood;
        }
        const updatedJournal = [newJournalEntry, ...safeArray(userData.journal)];
        let updates = { journal: updatedJournal };

        let tempUpdatedData = { ...userData, journal: updatedJournal };
        const newBadges = checkForNewBadges(tempUpdatedData);
        let xpGained = 0;
        if (newBadges.length > 0) {
            const badgeBonusXp = newBadges.length * 25;
            xpGained += badgeBonusXp;
            toast.success(`Badge Unlocked! +${badgeBonusXp} bonus XP!`);
            updates.badges = [...new Set([...safeArray(userData.badges), ...newBadges])];
        }

        if (xpGained > 0) {
            const updatedData = addXp(xpGained, userData);
            updates.xp = updatedData.xp;
            updates.level = updatedData.level;
        }

        if (xpGained > 0 || newBadges.length > 0) {
            setLastReward({ xp: xpGained, newBadges: newBadges.map(id => allBadges.find(b => b.id === id).name) });
            openModal('showReward');
        }

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, updates);
            closeJournalModal();
            toast.success("Your thoughts have been saved.");
        } catch (error) {
            console.error("Error saving journal entry:", error);
            toast.error("Failed to save your journal entry.");
        }
    };

    const updateJournalEntry = async (entryId, newText) => {
        if (!user || !userData || !newText.trim()) {
            toast.error("Journal entry cannot be empty.");
            return;
        }
        const updatedJournal = safeArray(userData.journal).map(entry =>
            entry.id === entryId ? { ...entry, entry: newText, date: new Date().toISOString(), insights: null } : entry
        );
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { journal: updatedJournal });
            toast.success("Journal entry updated!");
            closeJournalModal();
        } catch (error) {
            console.error("Error updating journal entry:", error);
            toast.error("Failed to update journal entry.");
        }
    };

    const deleteJournalEntry = async () => {
        if (!user || !userData || !entryToDelete) return;
        const updatedJournal = safeArray(userData.journal).filter(entry => entry.id !== entryToDelete.id);
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { journal: updatedJournal });
            toast.error("Journal entry deleted.");
            closeModal('isDeleteConfirmOpen');
            if (selectedJournalEntry?.id === entryToDelete.id) {
                closeModal('isJournalDetailOpen');
            }
            setEntryToDelete(null);
        } catch (error) {
            console.error("Error deleting journal entry:", error);
            toast.error("Failed to delete journal entry.");
        }
    };
    
    const completeFitnessTask = async (taskId) => {
        if (!user || !userData || !userData.dailyFitness) return;

        const updatedTasks = userData.dailyFitness.tasks.map(task =>
            task.id === taskId ? { ...task, completed: true } : task
        );
        const updatedFitnessData = { ...userData.dailyFitness, tasks: updatedTasks };

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { dailyFitness: updatedFitnessData });
            toast.success("Great work!", { duration: 2000 });
        } catch (error) {
            console.error("Error completing fitness task:", error);
            toast.error("Failed to save fitness progress.");
            return;
        }

        const allCompleted = updatedTasks.every(t => t.completed);
        if (allCompleted) {
            let xpGained = 25;
            const newFitnessCompletions = (userData.fitnessCompletions || 0) + 1;
            
            let tempUpdatedData = { ...userData, fitnessCompletions: newFitnessCompletions, dailyFitness: updatedFitnessData };
            const newBadges = checkForNewBadges(tempUpdatedData);
            if (newBadges.length > 0) {
                const badgeBonusXp = newBadges.length * 25;
                xpGained += badgeBonusXp;
                toast.success(`Badge Unlocked! +${badgeBonusXp} bonus XP!`);
            }

            const updatedData = addXp(xpGained, userData);
            const updatedBadges = newBadges.length > 0 ? [...new Set([...safeArray(userData.badges), ...newBadges])] : userData.badges;

            try {
                const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
                await updateDoc(userRef, { 
                    xp: updatedData.xp, 
                    level: updatedData.level,
                    fitnessCompletions: newFitnessCompletions,
                    badges: updatedBadges
                });
                setLastReward({ xp: xpGained, newBadges: newBadges.map(id => allBadges.find(b => b.id === id).name) });
                openModal('showFitnessCompleteModal');
            } catch (error) {
                console.error("Error finalizing fitness completion:", error);
                toast.error("Failed to save final fitness rewards.");
            }
        }
    };
    
    useEffect(() => {
        const checkHydrationReset = async () => {
            if (user && userData) {
                const todayStr = new Date().toISOString().split('T')[0];
                const lastLog = userData.hydration?.lastLogDate;

                if (lastLog !== todayStr) {
                    try {
                        const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
                        await updateDoc(userRef, {
                            'hydration.level': 0,
                            'hydration.lastLogDate': todayStr
                        });
                    } catch (error) {
                        console.error("Error resetting hydration:", error);
                    }
                }
            }
        };
        checkHydrationReset();
    }, [user, userData]);

    useEffect(() => {
        if (!user || !userData || !userData.hydration) return;

        const hydrationLevel = userData.hydration.level || 0;
        if (hydrationLevel >= 8) {
            return;
        }

        const twoHours = 2 * 60 * 60 * 1000;
        const timerId = setTimeout(() => {
            toast("Friendly reminder to drink some water!", { icon: '💧' });
        }, twoHours);

        return () => clearTimeout(timerId);

    }, [user, userData, userData?.hydration?.level]);

    const generateJournalInsights = async (journalEntry) => {
        if (!user || !userData) return;
        setIsInsightLoading(true);
        const toastId = toast.loading('Finding insights...');


        const prompt = `
            You are a warm, supportive, and insightful companion. A user has shared a journal entry with you. Your task is to offer a gentle, encouraging response.
            **Your Persona:**
            - You are NOT a therapist, doctor, or life coach.
            - Your tone is warm, easygoing, and non-judgmental, like a kind friend listening.
            - Speak in short, natural paragraphs.
            **Your Instructions:**
            1. **Read the Entry:** Carefully read the user's journal entry provided below.
            2. **Identify Key Themes:** Notice feelings, topics, or recurring ideas. Are they talking about challenges, gratitude, stress, joy, or uncertainty?
            3. **Reflect First:** Always begin by acknowledging and reflecting their feelings. Use phrases like: "It sounds like...", "I'm hearing that...", or "It takes courage to notice..."
            4. **Offer Gentle Ideas (Only If Invited):** - If the entry expresses uncertainty or feeling stuck (e.g., “I’m not sure what to do” or “I feel lost”), you may gently share **one simple, everyday idea** (like taking a break, journaling more, or doing something enjoyable).  
               - Present ideas as optional invitations, not instructions or solutions. Use phrasing like: *"You could try..."*, *"Maybe it might help to..."*, *"Some people find..."*.  
               - **NEVER** give medical, therapeutic, financial, or life-altering advice.
            5. **Find a Positive:** Highlight one strength, thoughtful observation, or effort they’ve shown.
            6. **Keep it Concise:** 2–3 short paragraphs.
            7. **Handle Unclear Input:**
               - If the entry is very short but seems to contain a real thought or feeling, respond with: "It looks like these thoughts are still taking shape. Journaling is a great space to explore them. Feel free to write more when you’re ready, and I'll be here to reflect with you."
               - If it’s nonsensical (e.g., 'asdfasdfasdf'), or contains no discernible meaning, respond with: "It looks like there might have been a slip of the fingers here! Whenever you’re ready to share your thoughts, I’m ready to listen."
            **User's Journal Entry:**
            ---
            ${journalEntry.entry}
            ---
        `;

        try {
            const response = await fetch('/api/generateAIContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            const insightText = data.result?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!insightText) throw new Error("No insight generated.");
            const updatedJournal = safeArray(userData.journal).map(entry =>
                entry.id === journalEntry.id ? { ...entry, insights: insightText } : entry
            );

            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { journal: updatedJournal });
            
            const updatedEntry = updatedJournal.find(e => e.id === journalEntry.id);
            if(updatedEntry) {
                openJournalDetail(updatedEntry);
            }

            toast.success('Insight revealed!', { id: toastId });

        } catch (error) {
            console.error("Failed to generate journal insights:", error);
            toast.error("The spirits of insight are quiet right now. Please try again later.", { id: toastId });
        } finally {
            setIsInsightLoading(false);
        }
    };

    const value = { 
        modalState, openModal, closeModal,
        lastReward, recordMood, 
        journalContext, saveJournalEntry, openJournalDetail, 
        selectedJournalEntry, openNewJournalEntry, isTasksLoading, isInsightLoading,
        entryToEdit, openEditJournal, confirmEditJournal, closeJournalModal, updateJournalEntry, 
        entryToDelete, openDeleteConfirm, deleteJournalEntry, 
        unlockedNodeInfo, setUnlockedNodeInfo, pathToAutoOpen, setPathToAutoOpen, userData, 
        completeSimpleTask, completeJournalingTask, completeNodeTask,
        completeFitnessTask, getXpForNextLevel,
        logWaterIntake, generateJournalInsights
    };
    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

const useAuth = () => useContext(AuthContext);
const useGame = () => useContext(GameContext);

// --- UI Components ---

const Header = () => {
    const { userData } = useAuth();
    const { getXpForNextLevel } = useGame();
    
    const xpData = useMemo(() => {
        const level = userData?.level || 1;
        const xp = userData?.xp || 0;

        const xpForCurrentLevelStart = level > 1 ? getXpForNextLevel(level - 1) : 0;
        const totalXpForNextLevel = getXpForNextLevel(level);
        const xpInCurrentLevel = xp - xpForCurrentLevelStart;
        const xpNeededForThisLevel = totalXpForNextLevel - xpForCurrentLevelStart;
        const progressPercentage = xpNeededForThisLevel > 0 ? (xpInCurrentLevel / xpNeededForThisLevel) * 100 : 0;
        return { xpInCurrentLevel, xpNeededForNextLevel: xpNeededForThisLevel, progressPercentage };
    }, [userData, getXpForNextLevel]);

    if (!userData) {
        return null;
    }

    const { displayName, avatarUrl, level } = userData;

    return (
        <header className="bg-gray-900/50 backdrop-blur-sm shadow-sm sticky top-0 z-20 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full border-2 border-purple-400 object-cover" />
                    <div>
                        <p className="font-bold text-lg text-gray-100">{displayName}</p>
                        <p className="text-sm text-purple-400 font-semibold">Level {level}</p>
                    </div>
                </div>
                <div className="w-1/3">
                    <div className="w-full bg-gray-700 rounded-full h-4">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded-full" style={{ width: `${xpData.progressPercentage}%` }}></div>
                    </div>
                    <p className="text-xs text-center mt-1 text-gray-300">{xpData.xpInCurrentLevel} / {xpData.xpNeededForNextLevel} XP</p>
                </div>
            </div>
        </header>
    );
};

const Layout = ({ children, className = '' }) => (
    <div className={`min-h-screen font-sans ${className}`}>
        <Header />
        <main className="container mx-auto p-4 md:p-8 relative z-10">
            {children}
            <div className="h-40 w-full" /> {/* Invisible spacer for scrolling */}
        </main>
    </div>
);

const MoodSelector = () => {
    const { recordMood, userData } = useGame();
    const [selectedMood, setSelectedMood] = useState(null);

    useEffect(() => {
        if (!userData) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayMood = safeArray(userData.moodHistory).find(m => m.date.startsWith(todayStr));
        if (todayMood) {
            setSelectedMood(todayMood.mood);
        } else {
            setSelectedMood(null);
        }
    }, [userData]);

    return (
        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-bold text-center text-gray-100 mb-4">How are you feeling today?</h2>
            <div className="flex justify-around items-center">
                {moods.map(({ value, icon: Icon, color }) => (
                    <motion.button 
                        key={value} 
                        onClick={() => recordMood(value)} 
                        className={`p-3 rounded-full transition-all duration-200 ease-in-out hover:scale-110 ${selectedMood === value ? 'bg-purple-900/50 ring-2 ring-purple-400' : 'hover:bg-gray-700/50'}`} 
                        aria-label={`Mood ${value}`} 
                        whileTap={{ scale: 1.2 }}
                    >
                        <Icon size={40} className={`${color} ${selectedMood === value ? '' : 'opacity-70'}`} />
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

const HydrationMeter = () => {
    const { userData } = useAuth();
    const { logWaterIntake } = useGame();
    const hydrationLevel = userData?.hydration?.level || 0;
    const fillPercentage = (hydrationLevel / 8) * 100;
    const isComplete = hydrationLevel >= 8;

    return (
        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg mb-8 text-white">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                   <Droplets size={24} className="text-cyan-400" />
                   <h3 className="text-lg font-semibold text-gray-100">Daily Hydration - Don't Forget To Drink Water :)</h3>
                </div>
                <p className="font-bold text-cyan-300">{hydrationLevel} / 8</p>
            </div>
            <div 
                className={`w-full bg-gray-700 rounded-full h-6 p-1 transition-all ${isComplete ? 'cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-cyan-400/50'}`}
                onClick={logWaterIntake}
            >
                <div className="relative w-full h-full">
                    <div 
                        className="bg-gradient-to-r from-cyan-400 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${fillPercentage}%` }}
                    ></div>
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="absolute top-0 h-full w-px bg-gray-900/50" style={{ left: `${(i + 1) * 12.5}%` }}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DailyTasksCard = () => {
    const { userData, completeSimpleTask, completeJournalingTask } = useGame();
    const { tasks } = userData.dailyContent || { tasks: [] };
    const [journalInputs, setJournalInputs] = useState({});

    const handleJournalInputChange = (taskId, value) => {
        setJournalInputs(prev => ({ ...prev, [taskId]: value }));
    };

    const handleJournalSubmit = (task) => {
        const journalText = journalInputs[task.id] || '';
        if (journalText.length >= 10) {
            completeJournalingTask(task, journalText);
        } else {
            toast.error("Journal entry must be at least 10 characters long.");
        }
    };

    const pathStyles = {
        Resilience: { icon: Shield, color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-900/20' },
        Focus: { icon: Zap, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-900/20' },
        Positivity: { icon: Wind, color: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-900/20' },
    };

    return (
        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-xl font-semibold text-purple-300 uppercase mb-4 text-center">Your Daily Tasks</h3>
            <div className="space-y-4">
                {tasks.map((task) => {
                    const { icon: Icon, color, border, bg } = pathStyles[task.category] || {};
                    const isJournalingTask = task.isJournaling;
                    const isCompleted = task.completed;
                    const journalText = journalInputs[task.id] || '';

                    return (
                        <div key={task.id} className={`p-4 rounded-lg border ${border} ${bg} transition-all duration-300 ${isCompleted ? 'opacity-50' : ''}`}>
                            <div className="flex items-start space-x-4">
                                <Icon size={24} className={`${color} mt-1`} />
                                <div className="flex-grow">
                                    <p className={`font-semibold ${isCompleted ? 'line-through' : ''}`}>{task.task}</p>
                                    {isJournalingTask && !isCompleted && (
                                        <div className="mt-2">
                                            <textarea
                                                value={journalText}
                                                onChange={(e) => handleJournalInputChange(task.id, e.target.value)}
                                                rows="3"
                                                className="w-full p-2 bg-gray-700/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-400 transition"
                                                placeholder="Reflect on your task here..."
                                            />
                                        </div>
                                    )}
                                </div>
                                {isCompleted && (
                                    <div className="flex-shrink-0">
                                        <ClipboardCheck size={24} className="text-green-400" />
                                    </div>
                                )}
                            </div>
                           {!isCompleted && (
                                <div className="flex justify-end mt-2">
                                    {isJournalingTask ? (
                                        <button
                                            onClick={() => handleJournalSubmit(task)}
                                            disabled={journalText.length < 10}
                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                        >
                                            Save & Complete
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => completeSimpleTask(task.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                        >
                                            Complete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const BigQuestCard = () => {
    return (
        <div className="bg-gray-800/60 backdrop-blur-md p-8 rounded-xl shadow-lg text-center text-white">
            <h2 className="text-2xl font-bold text-green-400 mb-2">Daily Tasks Complete!</h2>
            <p className="text-gray-300">Your Big Quest awaits on the World Map.</p>
        </div>
    );
};

const SimpleConfetti = () => {
    const canvasRef = useRef(null);

    useEffect(() => { 
        const canvas = canvasRef.current; 
        if (!canvas) return; 
        const ctx = canvas.getContext('2d'); 
        let { width, height } = canvas.getBoundingClientRect(); 
        const dpr = window.devicePixelRatio || 1; 
        canvas.width = width * dpr; 
        canvas.height = height * dpr; 
        ctx.scale(dpr, dpr);

        const colors = ['#FFD700', '#a8d5ba', '#d4a5a5', '#a5b4d4', '#8b5cf6'];
        const numParticles = 150;
        let particles = Array.from({ length: numParticles }).map(() => ({ 
            x: Math.random() * width,
            y: -20 - Math.random() * height,
            w: 10, h: 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: Math.random() * 6 - 3,
            vy: Math.random() * 5 + 2,
            angle: Math.random() * 2 * Math.PI,
            rotationSpeed: Math.random() * 0.1 - 0.05
        })); 

        let animationFrameId; 

        const draw = () => { 
            if (!ctx) return; 
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { 
                p.x += p.vx; 
                p.y += p.vy; 
                p.angle += p.rotationSpeed; 
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color; 
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
                if (p.y > height + 20) { 
                    p.x = Math.random() * width; 
                    p.y = -20; 
                } 
            }); 
            animationFrameId = requestAnimationFrame(draw); 
        }; 

        draw();
        const timeoutId = setTimeout(() => cancelAnimationFrame(animationFrameId), 4000); 
        return () => { 
            cancelAnimationFrame(animationFrameId); 
            clearTimeout(timeoutId); 
        }; 
    }, []);

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />;
};

const RewardModal = ({ onClose }) => {
    const { modalState: { showReward }, lastReward } = useGame();

    return (
        <AnimatePresence>
        {showReward &&
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <SimpleConfetti />
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{opacity: 0, scale: 0.7}} className="relative bg-gray-800 border border-purple-500/50 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center text-white">
                <h2 className="text-3xl font-bold text-purple-400 mb-2">Well Done!</h2>
                <p className="text-gray-300 mb-6">Your courage shines bright!</p>
                {lastReward.xp > 0 && <div className="bg-gray-700/50 rounded-xl p-4 mb-6"><p className="text-xl font-bold text-purple-300">+{lastReward.xp} XP Gained</p></div>}
                {lastReward.newBadges.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-bold text-lg text-yellow-400 mb-2">Badge Unlocked!</h3>
                        {lastReward.newBadges.map(badge => ( 
                            <p key={badge} className="bg-yellow-500 text-yellow-900 font-semibold px-4 py-2 rounded-full inline-block shadow-md"> {badge} </p> 
                        ))}
                    </div>
                )}
                <button 
                    onClick={onClose} 
                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors"
                > 
                    Continue Journey 
                </button>
            </motion.div>
        </div>
        }
        </AnimatePresence>
    );
};

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [displayName, setDisplayName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const { user } = useAuth();

    const handleFinish = async () => {
        if (!user || !displayName.trim() || !selectedAvatar || !selectedGoal) return;
        
        const newUserProfile = {
            uid: user.uid, displayName: displayName.trim(), avatarUrl: selectedAvatar.url, mainPath: selectedGoal.id,
            level: 1, xp: 0, streak: 0, questCount: 0, lastQuestDate: null, lastMoodDate: null,
            completedQuests: [], badges: [], moodHistory: [], journal: [], 
            dailyContent: null,
            unlockedNodes: [],
            completedNodes: [],
            completedNodeTasks: {},
            dailyFitness: null,
            completedTasksHistory: [],
            hydration: {
                level: 0,
                lastLogDate: new Date().toISOString().split('T')[0]
            },
            createdAt: new Date().toISOString()
        };
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await setDoc(userRef, newUserProfile);
        } catch (error) {
            console.error("Error creating user profile:", error);
            toast.error("Could not create your profile. Please try again.");
        }
    };

    const handleNameSubmit = (e) => {
        if (e.key === 'Enter' && displayName.trim()) {
            e.preventDefault();
            setStep(2);
        }
    };

    const handleFinishOnEnter = React.useCallback(handleFinish, [user, displayName, selectedAvatar, selectedGoal]);

    useEffect(() => {
        const handleGlobalEnter = (e) => {
            if (e.key !== 'Enter') return;
            if (step === 2 && selectedAvatar) { e.preventDefault(); setStep(3); } 
            else if (step === 3 && selectedGoal) { e.preventDefault(); handleFinishOnEnter(); }
        };
        window.addEventListener('keydown', handleGlobalEnter);
        return () => window.removeEventListener('keydown', handleGlobalEnter);
    }, [step, selectedAvatar, selectedGoal, handleFinishOnEnter]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-8 text-white">
                {step === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="text-3xl font-bold text-center">Welcome, Adventurer!</h2>
                        <p className="text-center text-gray-300 mt-2">What shall we call you?</p>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} onKeyDown={handleNameSubmit} placeholder="Enter your name" className="w-full mt-6 p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-center text-lg focus:ring-2 focus:ring-purple-400" autoFocus />
                        <button onClick={() => setStep(2)} disabled={!displayName.trim()} className="w-full mt-4 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-500 transition-colors">Next</button>
                    </motion.div>
                )}
                {step === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="text-2xl font-bold text-center">Choose Your Avatar</h2>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {avatars.map(avatar => (
                                <div key={avatar.id} onClick={() => setSelectedAvatar(avatar)} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAvatar?.id === avatar.id ? 'border-purple-500 ring-2 ring-purple-300 bg-gray-700/50' : 'border-gray-600 bg-gray-700/20'}`}>
                                    <img src={avatar.url} alt={avatar.name} className="w-24 h-24 mx-auto rounded-full object-cover" />
                                    <p className="text-center font-semibold mt-2">{avatar.name}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4">
                            <button onClick={() => setStep(1)} className="bg-gray-600 text-gray-100 font-bold py-2 px-6 rounded-lg hover:bg-gray-500">Back</button>
                            <button onClick={() => setStep(3)} disabled={!selectedAvatar} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">Next</button>
                        </div>
                    </motion.div>
                )}
                {step === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="text-2xl font-bold text-center">What is your primary goal?</h2>
                        <div className="space-y-4 mt-6">
                            {goals.map(goal => (
                                <div key={goal.id} onClick={() => setSelectedGoal(goal)} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedGoal?.id === goal.id ? 'border-purple-500 ring-2 ring-purple-300 bg-gray-700/50' : 'border-gray-600 bg-gray-700/20'}`}>
                                    <h3 className="font-bold text-lg">{goal.name}</h3>
                                    <p className="text-sm text-gray-300">{goal.description}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4">
                            <button onClick={() => setStep(2)} className="bg-gray-600 text-gray-100 font-bold py-2 px-6 rounded-lg hover:bg-gray-500">Back</button>
                            <button onClick={handleFinish} disabled={!selectedGoal} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500 hover:bg-green-700">Begin Quest!</button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const DailyQuestScreen = () => {
    const { isTasksLoading, userData } = useGame();
    const dailyContent = userData?.dailyContent;

    const renderContent = () => {
        if (isTasksLoading || !dailyContent) {
            return (
                <div className="text-center p-12 bg-gray-800/60 backdrop-blur-md rounded-xl text-white">
                    <p className="text-xl font-semibold animate-pulse">Forging your daily challenges...</p>
                </div>
            );
        }

        if (dailyContent?.allSmallTasksCompleted) {
            return <BigQuestCard />;
        }

        return <DailyTasksCard />;
    };

    return (
        <div className="relative min-h-screen">
            <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{backgroundImage: "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb')"}}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
            <Layout className="bg-transparent">
                <MoodSelector />
                <HydrationMeter />
                {renderContent()}
            </Layout>
        </div>
    );
};

const JournalModal = () => {
    const { modalState: { isJournalOpen }, journalContext, saveJournalEntry, entryToEdit, updateJournalEntry, closeJournalModal } = useGame();
    const [entry, setEntry] = useState('');
    const isEditing = !!entryToEdit;

    useEffect(() => {
        if (isJournalOpen) {
            if (isEditing) {
                setEntry(entryToEdit.entry);
            } else {
                setEntry('');
            }
        }
    }, [isJournalOpen, isEditing, entryToEdit]);

    if (!isJournalOpen) return null;

    const handleSave = () => {
        if (isEditing) {
            updateJournalEntry(entryToEdit.id, entry);
        } else {
            saveJournalEntry(entry, journalContext);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-100 mb-4">{isEditing ? 'Edit Journal Entry' : 'Personal Journal'}</h2>
                <textarea
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    rows="6"
                    className="w-full p-3 bg-gray-700/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-400"
                    placeholder={journalContext.prompt || "Write how you feel..."}
                ></textarea>
                <div className="flex justify-end space-x-4 mt-4">
                    <button
                        onClick={closeJournalModal}
                        className="px-6 py-2 bg-gray-600 text-gray-100 font-semibold rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {isEditing ? 'Update' : 'Save'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const JournalDetailModal = () => {
    const { modalState: { isJournalDetailOpen }, closeModal, selectedJournalEntry, openEditJournal, openDeleteConfirm, generateJournalInsights, isInsightLoading } = useGame();
    if (!isJournalDetailOpen || !selectedJournalEntry) return null;

    const Icon = selectedJournalEntry.mood ? getMoodProps(selectedJournalEntry.mood)?.icon : null;
    const color = selectedJournalEntry.mood ? getMoodProps(selectedJournalEntry.mood)?.color : 'text-gray-400';
    const entryDate = new Date(selectedJournalEntry.date);

    const handleEdit = () => {
        closeModal('isJournalDetailOpen');
        openEditJournal(selectedJournalEntry);
    };

    const handleDelete = () => {
        openDeleteConfirm(selectedJournalEntry);
    };

    const handleGetInsights = () => {
        generateJournalInsights(selectedJournalEntry);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-gray-200 flex flex-col h-[80vh]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center space-x-3">
                            {Icon && <Icon className={color} size={28} />}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-100">{entryDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                                <p className="text-sm text-gray-400">{entryDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                            </div>
                        </div>
                        <span className="text-xs font-medium bg-gray-600 text-gray-200 px-2 py-1 rounded-full mt-2 inline-block capitalize">{selectedJournalEntry.source}</span>
                    </div>
                    <button onClick={() => closeModal('isJournalDetailOpen')} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto flex-grow pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-4">
                    <p className="whitespace-pre-wrap leading-relaxed">{selectedJournalEntry.entry}</p>
                    {selectedJournalEntry.insights && (
                        <div className="mt-6 border-t-2 border-purple-500/30 pt-4">
                           <h3 className="text-lg font-bold text-purple-400 mb-2 flex items-center space-x-2">
                                <Sparkles size={20} />
                                <span>A Moment of Reflection</span>
                            </h3>
                            <p className="whitespace-pre-wrap leading-relaxed text-gray-300 italic">{selectedJournalEntry.insights}</p>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-4 border-t border-gray-700 pt-4">
                    {!selectedJournalEntry.insights && (
                         <button onClick={handleGetInsights} disabled={isInsightLoading} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-500">
                             {isInsightLoading ? (
                                 <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                             ) : (
                                 <Sparkles size={18}/>
                             )}
                             <span>{isInsightLoading ? 'Thinking...' : 'Get Insights'}</span>
                         </button>
                    )}
                    <button onClick={handleEdit} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"><Edit size={18}/><span>Edit</span></button>
                    <button onClick={handleDelete} className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"><Trash2 size={18}/><span>Delete</span></button>
                </div>
            </motion.div>
        </div>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
             <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full">
                <h2 className="text-xl font-bold text-gray-100 mb-4">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-4 mt-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-gray-100 font-semibold rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Confirm</button>
                </div>
            </motion.div>
        </div>
    )
};

const NodeUnlockModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
       <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800 border border-yellow-500/50 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
                <div className="flex justify-center mb-4">
                    <Star size={48} className="text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">New Node Unlocked!</h2>
                <p className="text-gray-300 mb-6">Your journey continues. A new milestone awaits on your path. Want to check it out?</p>
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-gray-100 font-semibold rounded-lg hover:bg-gray-500 transition-colors">Later</button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">Explore Map</button>
                </div>
            </motion.div>
       </div>
    )
};

const Dashboard = ({ setCurrentPage }) => {
    const { userData } = useAuth(); 
    if (!userData) return <div className="text-center p-8 text-white">Loading stats...</div>; 
    const { level, xp, streak, badges } = userData;

    return (
        <Layout className="text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg text-center"><h3 className="text-lg font-semibold text-gray-400">Level</h3><p className="text-5xl font-bold text-purple-400">{level}</p></div>
                <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg text-center"><h3 className="text-lg font-semibold text-gray-400">Total XP</h3><p className="text-5xl font-bold text-indigo-400">{xp}</p></div>
                <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg text-center"><h3 className="text-lg font-semibold text-gray-400">Quest Streak</h3><p className="text-5xl font-bold text-teal-400">{streak} {streak === 1 ? 'day' : 'days'}</p></div>
            </div>
            <div className="mb-8"><MoodHistoryChart /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    onClick={() => setCurrentPage('map')}
                    className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg cursor-pointer group hover:bg-gray-700/80 transition-colors"
                >
                    <h3 className="text-xl font-bold text-gray-100 mb-4">World Map</h3>
                    <div className="bg-gray-700/50 aspect-video rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <p className="text-gray-400 font-semibold flex items-center space-x-2">
                            <Map size={20} />
                            <span>Explore Your Journey</span>
                        </p>
                    </div>
                </div>
                <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg"><h3 className="text-xl font-bold text-gray-100 mb-4">Your Badges</h3>{safeArray(badges).length > 0 ? (<div className="flex flex-wrap gap-2">{badges.map(badgeId => {
                    const badge = allBadges.find(b => b.id === badgeId);
                    return badge ? (<span key={badge.id} className="bg-yellow-500 text-yellow-900 text-sm font-semibold px-3 py-1 rounded-full shadow" title={badge.description}>{badge.name}</span>) : null;
                })}</div>) : (<p className="text-gray-400">Complete quests to earn new badges!</p>)}</div>
            </div>
        </Layout>
    );
};

const JournalPage = () => {
    const { userData } = useAuth();
    const { openJournalDetail, openNewJournalEntry, openEditJournal, openDeleteConfirm, generateJournalInsights } = useGame();
    const [openMenuId, setOpenMenuId] = useState(null);
    const journalEntries = safeArray(userData?.journal).sort((a, b) => new Date(b.date) - new Date(a.date));
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <div 
            className="relative min-h-screen bg-cover bg-center bg-fixed" 
            style={{backgroundImage: "url('https://images.unsplash.com/photo-1637689113621-73951984fcc1?q=80&w=687&auto=format&fit=crop')"}}
        >
            <div className="absolute inset-0 bg-black/50"></div>
            <Layout className="bg-transparent text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-100">Your Journal</h2>
                    <button onClick={openNewJournalEntry} className="flex items-center space-x-2 bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg"><PlusCircle size={20} /><span>New Entry</span></button>
                </div>
                <div className="space-y-4">
                    {journalEntries.length > 0 ? journalEntries.map((entry) => {
                        const moodProps = entry.mood ? getMoodProps(entry.mood) : null;
                        const Icon = moodProps?.icon;
                        const entryDate = new Date(entry.date);
                        return (
                            <motion.div key={entry.id} layout className={`relative bg-gray-800/60 backdrop-blur-md p-5 rounded-xl shadow-lg transition-colors hover:bg-gray-700/80 ${openMenuId === entry.id ? 'z-20' : 'z-10'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-4 flex-grow cursor-pointer" onClick={() => openJournalDetail(entry)}>
                                        {Icon && <Icon className={moodProps.color} size={24} />}
                                        <div>
                                            <p className="font-semibold text-gray-200">{entryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                            <p className="text-xs text-gray-400">{entryDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="relative" ref={openMenuId === entry.id ? menuRef : null}>
                                        <button onClick={() => setOpenMenuId(openMenuId === entry.id ? null : entry.id)} className="p-2 rounded-full hover:bg-gray-600/50"><MoreVertical size={20}/></button>
                                        <AnimatePresence>
                                        {openMenuId === entry.id && (
                                            <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.9}} className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-30">
                                                {!entry.insights && (
                                                    <button onClick={() => { generateJournalInsights(entry); setOpenMenuId(null); }} className="flex items-center w-full space-x-2 px-4 py-2 text-left text-sm text-purple-400 hover:bg-gray-700"><Sparkles size={16}/><span>Get Insights</span></button>
                                                )}
                                                <button onClick={() => { openEditJournal(entry); setOpenMenuId(null); }} className="flex items-center w-full space-x-2 px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"><Edit size={16}/><span>Edit</span></button>
                                                <button onClick={() => { openDeleteConfirm(entry); setOpenMenuId(null); }} className="flex items-center w-full space-x-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700"><Trash2 size={16}/><span>Delete</span></button>
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="mt-2 text-gray-300 truncate cursor-pointer" onClick={() => openJournalDetail(entry)}>
                                    {entry.entry}
                                </div>
                            </motion.div>
                        )
                    }) : (
                        <div className="text-center text-gray-400 py-8">
                            <p>Your journal is empty.</p>
                            <p>Start by logging your mood or completing a task!</p>
                        </div>
                    )}
                </div>
            </Layout>
        </div>
    );
}

const MoodHistoryChart = () => {
    const { userData } = useAuth();
    const moodData = safeArray(userData?.moodHistory);
    
    const last7DaysData = React.useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); 
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayMonth = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            const moodEntry = moodData.find(entry => entry.date.startsWith(dateStr));
            data.push({ name: dayMonth, mood: moodEntry ? moodEntry.mood : null });
        }
        return data;
    }, [moodData]);


    const formatMoodTick = (tickValue) => {
        const mood = moods.find(m => m.value === tickValue);
        return mood ? mood.label : '';
    };

    const formatTooltipValue = (value) => {
        const mood = moods.find(m => m.value === value);
        return mood ? mood.label : 'N/A';
    };

    return (
        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg h-96">
            <h3 className="text-xl font-bold text-gray-100 mb-4">Your Mood Journey (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={last7DaysData} margin={{ top: 20, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#A0AEC0' }} />
                    <YAxis 
                        domain={[0, 5]}
                        ticks={[1, 2, 3, 4, 5]} 
                        tick={{ fill: '#A0AEC0' }} 
                        tickFormatter={formatMoodTick} 
                        interval={0}
                        width={80}
                    />
                    <Tooltip 
                        wrapperStyle={{ boxShadow: 'none', border: 'none', outline: 'none' }}
                        contentStyle={{ 
                            backgroundColor: 'rgba(26, 32, 44, 0.9)', 
                            border: '1px solid #4A5568', 
                            borderRadius: '0.5rem', 
                            color: '#E2E8F0',
                        }}
                        formatter={formatTooltipValue}
                    />
                    <Bar dataKey="mood" fill="#8B5CF6" name="Mood Level" barSize={30} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const PathView = ({ path, onBack, onNodeClick }) => {
    const { userData } = useAuth();
    const nodes = mapNodesData.filter(n => n.path === path);
    const containerRef = useRef(null);
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setSvgDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.scrollHeight,
                });
            }
        };
        
        const timeoutId = setTimeout(updateDimensions, 100);
        window.addEventListener('resize', updateDimensions);
        
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateDimensions);
        };
    }, [nodes]);
    
    const pathConfigs = {
        resilience: { title: "Path of Resilience", icon: Shield, background: "url('https://images.unsplash.com/photo-1684691779309-ea3a0f0a4539?q=80&w=1171&auto=format&fit=crop')", isImage: true },
        focus: { title: "Path of Focus", icon: Zap, background: "url('https://images.unsplash.com/photo-1543946207-39bd91e70ca7?q=80&w=1974&auto=format&fit=crop')", isImage: true },
        positivity: { title: "Path of Positivity", icon: Wind, background: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1170&auto=format&fit=crop')", isImage: true },
    };

    const currentPath = pathConfigs[path];

    const pathD = nodes.map((node, index) => {
        const command = index === 0 ? 'M' : 'L';
        const x = svgDimensions.width > 0 ? (parseInt(node.position.left) / 100) * svgDimensions.width : 0;
        const y = svgDimensions.height > 0 ? (parseInt(node.position.top) / 100) * svgDimensions.height : 0;
        return `${command} ${x} ${y}`;
    }).join(' ');

    const getBackgroundStyle = () => ({
        backgroundImage: currentPath.background,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    });

    return (
        <motion.div 
            className="fixed inset-0 overflow-y-auto"
            style={getBackgroundStyle()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="sticky top-0 p-4 z-30 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <button onClick={onBack} className="flex items-center space-x-2 bg-gray-800/70 backdrop-blur-sm text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg">
                    <ArrowLeft size={20} />
                    <span>World Map</span>
                </button>
               <h2 className="text-3xl font-bold text-white drop-shadow-lg" style={{ fontFamily: "'Cinzel Decorative', cursive" }}>
                   {currentPath.title}
               </h2>
                <div className="w-36"></div>
            </div>

            <div ref={containerRef} className="relative w-full mx-auto max-w-4xl z-20" style={{ height: '250vh' }}>
                <svg width={svgDimensions.width} height={svgDimensions.height} className="absolute top-0 left-0 pointer-events-none">
                    <path d={pathD} stroke={lineColors[path]} strokeWidth="2" fill="none" strokeDasharray="8 8" strokeOpacity={'0.7'} />
                </svg>
                {nodes.map((node) => {
                    const isUnlocked = safeArray(userData.unlockedNodes).includes(node.id);
                    const isCompleted = safeArray(userData.completedNodes).includes(node.id);
                    return <MapNode key={node.id} node={node} isUnlocked={isUnlocked} isCompleted={isCompleted} onClick={onNodeClick} />
                })}
            </div>
        </motion.div>
    );
};

const MapNode = ({ node, isUnlocked, isCompleted, onClick }) => {
    const getStyles = () => {
        const completedStyles = `cursor-not-allowed ${nodePathStyles[node.path]} opacity-50`;
        const unlockedStyles = `cursor-pointer ${nodePathStyles[node.path]}`;
        const lockedStyles = `cursor-not-allowed ${lockedNodePathStyles[node.path]} opacity-100`;
        
        if (isCompleted) return completedStyles;
        if (isUnlocked) return unlockedStyles;
        return lockedStyles;
    }

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
            style={{ top: node.position.top, left: node.position.left }}
            onClick={() => isUnlocked && !isCompleted && onClick(node)}
        >
            <motion.div
                whileHover={isUnlocked && !isCompleted ? { scale: 1.2 } : {}}
                whileTap={isUnlocked && !isCompleted ? { scale: 0.9 } : {}}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 shadow-lg transition-all duration-300 ${getStyles()}`}
            >
                {isCompleted ? <CheckCircle size={24} className="text-white" /> : (isUnlocked ? <div className={`w-4 h-4 bg-white/80 rounded-full`}></div> : <Lock size={24} className="text-gray-400" />)}
            </motion.div>
            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-3 py-1 bg-gray-900/80 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30`}>
                {node.name}
            </div>
        </div>
    );
};


const FitnessHubView = ({ onBack }) => {
    const { userData, completeFitnessTask } = useGame();
    const { dailyFitness } = userData || {};
    const tasks = safeArray(dailyFitness?.tasks);
    const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed);

    return (
        <motion.div
            className="fixed inset-0 overflow-y-auto bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="sticky top-0 p-4 z-30 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <button onClick={onBack} className="flex items-center space-x-2 bg-gray-800/70 backdrop-blur-sm text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg">
                    <ArrowLeft size={20} />
                    <span>World Map</span>
                </button>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg" style={{ fontFamily: "'Cinzel Decorative', cursive" }}>
                    Fitness Hub
                </h2>
                <div className="w-36"></div>
            </div>
            <div className="relative z-20 container mx-auto p-4 md:p-8 text-white text-center">
                <div className="bg-gray-800/60 backdrop-blur-md p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
                    <Dumbbell size={64} className="mx-auto text-orange-400 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Daily Physical Challenge</h3>
                    <p className="text-gray-300 mb-6">Strengthen your body to support your mind. Complete these tasks for a bonus reward.</p>
                    
                    <div className="space-y-4 text-left">
                        {tasks.map(task => (
                            <div key={task.id} className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 ${task.completed ? 'bg-green-800/40' : 'bg-white/10'}`}>
                                <p className={`font-semibold transition-colors ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                                    <span className="font-bold text-orange-400 mr-2">Step {task.level}:</span>
                                    {task.text}
                                </p>
                                <button
                                    onClick={() => !task.completed && completeFitnessTask(task.id)}
                                    disabled={task.completed}
                                    className="p-2 rounded-full disabled:cursor-not-allowed"
                                >
                                    {task.completed ? <CheckCircle className="text-green-400" size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-gray-400 hover:bg-orange-500/20"></div>}
                                </button>
                            </div>
                        ))}
                    </div>

                    {allTasksCompleted && (
                         <div className="mt-8 text-green-400 flex flex-col items-center">
                            <p className="text-xl font-semibold">Well done! All challenges complete for today.</p>
                        </div>
                    )}
                </div>
                 <div className="h-40 w-full" />
            </div>
        </motion.div>
    );
};

const FitnessUnlockModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800 border border-orange-500/50 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
                <div className="flex justify-center mb-4">
                    <Dumbbell size={48} className="text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Fitness Hub Unlocked!</h2>
                <p className="text-gray-300 mb-6">By completing your quest, you've gained access to the Fitness Hub on the World Map. Strengthen your body to fortify your mind.</p>
                <button onClick={onClose} className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors">Awesome!</button>
            </motion.div>
        </div>
    );
};

const FitnessCompleteModal = ({ isOpen, onClose }) => {
    const { lastReward } = useGame();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
             <SimpleConfetti />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="relative bg-gray-800 border border-orange-500/50 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center text-white">
                <h2 className="text-3xl font-bold text-orange-400 mb-2">Energized!</h2>
                <p className="text-gray-300 mb-4">Great work! You've fueled your body and mind.</p>
                <div className="bg-gray-700/50 rounded-xl p-4 mb-4">
                    <p className="text-xl font-bold text-orange-300">+{lastReward.xp} XP Gained</p>
                </div>
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-4 mb-6 flex items-center justify-center space-x-3">
                    <Droplets size={24} className="text-blue-400" />
                    <p className="font-semibold text-blue-300">Hydration Check: Don't forget to drink some water!</p>
                </div>
                <button onClick={onClose} className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition-colors">
                    Continue Journey
                </button>
            </motion.div>
        </div>
    );
};


const WorldMapPage = ({ onNodeClick }) => {
    const { userData } = useAuth();
    const { pathToAutoOpen, setPathToAutoOpen } = useGame();
    const [view, setView] = useState('main');

    useEffect(() => {
        if (pathToAutoOpen) {
            setView('path');
        }
    }, [pathToAutoOpen]);

    if (!userData) {
        return null; // or a loading indicator
    }

    if (view === 'path') {
        return <PathView path={userData.mainPath} onBack={() => { setView('main'); setPathToAutoOpen(null); }} onNodeClick={onNodeClick} />;
    }
    
    if (view === 'fitness') {
        return <FitnessHubView onBack={() => setView('main')} />;
    }

    const mainPathData = goals.find(g => g.id === userData.mainPath);
    const pathIcon = {
        resilience: Shield,
        focus: Zap,
        positivity: Wind
    }[userData.mainPath];

    const isFitnessIslandLocked = safeArray(userData.completedNodes).length === 0;

    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>
                <div className="absolute inset-0 bg-black/50"></div>
            </div>
            <div className="relative flex flex-col items-center justify-center h-full p-4 overflow-y-auto pb-32">
                <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg" style={{ fontFamily: "'Cinzel Decorative', cursive" }}>Your Journey</h1>
                <p className="text-lg text-gray-300 mb-12 drop-shadow-md">Continue your main path or visit the Fitness Hub.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <PathCard 
                        icon={pathIcon}
                        title={`Path of ${mainPathData.name}`}
                        description={mainPathData.description}
                        color={{resilience: 'red', focus: 'blue', positivity: 'green'}[userData.mainPath]}
                        onClick={() => setView('path')}
                    />
                   <PathCard 
                        icon={Dumbbell}
                        title="Fitness Hub"
                        description="Strengthen your body to support your mind."
                        color="orange"
                        onClick={() => !isFitnessIslandLocked && setView('fitness')}
                        isLocked={isFitnessIslandLocked}
                        lockMessage="Complete your first Big Quest to unlock"
                    />
                </div>
            </div>
        </div>
    );
};

const PathCard = ({ icon: Icon, title, description, color, onClick, isLocked = false, lockMessage }) => {
    const colors = {
        red: "from-red-500/20 to-red-500/10 border-red-500/50 hover:border-red-500",
        blue: "from-blue-500/20 to-blue-500/10 border-blue-500/50 hover:border-blue-500",
        green: "from-green-500/20 to-green-500/10 border-green-500/50 hover:border-green-500",
        orange: "from-orange-500/20 to-orange-500/10 border-orange-500/50 hover:border-orange-500",
    }
    const iconColors = {
        red: "text-red-400",
        blue: "text-blue-400",
        green: "text-green-400",
        orange: "text-orange-400",
    }

    const lockedClasses = "opacity-50 cursor-not-allowed";

    return (
        <motion.div
            onClick={!isLocked ? onClick : () => {}}
            className={`relative bg-gradient-to-br ${colors[color]} border-2 rounded-2xl p-8 text-center flex flex-col items-center backdrop-blur-sm transition-all duration-300 shadow-lg ${isLocked ? lockedClasses : 'cursor-pointer hover:scale-105 hover:shadow-2xl'}`}
            whileHover={!isLocked ? { y: -10 } : {}}
        >
            {isLocked && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center z-10 p-4">
                    <Lock size={32} className="text-gray-200 mb-2" />
                    <p className="text-sm font-semibold text-gray-200">{lockMessage}</p>
                </div>
            )}
            <Icon className={`${iconColors[color]} mb-4`} size={48} />
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <p className="text-gray-300">{description}</p>
        </motion.div>
    );
};

const NodeModal = ({ node, onClose }) => {
    const { userData, completeNodeTask } = useGame();
    const { bigQuest } = userData.dailyContent || {};
    const isQuestAvailable = userData.dailyContent?.allSmallTasksCompleted;

    const handleComplete = () => {
        completeNodeTask(node);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="relative bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-gray-200"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-700 transition-colors"><X size={24} /></button>
                <h2 className="text-2xl font-bold text-white mb-2">{node.name}</h2>
                <p className="text-lg text-purple-400 mb-4">Your Big Quest</p>
                {isQuestAvailable ? (
                    <>
                        <p className="bg-gray-900/50 p-4 rounded-lg mb-6">{bigQuest?.task}</p>
                        <button 
                            onClick={handleComplete}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Complete Quest (+50 XP)
                        </button>
                    </>
                ) : (
                    <p className="text-center text-gray-400 py-8">Complete your three daily tasks to unlock this Big Quest.</p>
                )}
            </motion.div>
        </div>
    );
};


// --- Main App Component ---

const MindQuestApp = () => {
    const { userData, loading } = useAuth();
    const { 
        modalState, closeModal,
        deleteJournalEntry, confirmEditJournal,
        unlockedNodeInfo, setUnlockedNodeInfo, 
        setPathToAutoOpen
    } = useGame();
    const [currentPage, setCurrentPage] = useState('quest');
    const [isNavOpen, setIsNavOpen] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);
    const [mapKey, setMapKey] = useState(Date.now());

    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><p className="text-xl font-semibold text-white animate-pulse">Loading your world...</p></div>;
    if (!userData) return <Onboarding />;

    const pageVariants = { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } };
    
    const handleCloseRewardModal = () => {
        closeModal('showReward');
    };

    const handleGoToMap = () => {
        if (unlockedNodeInfo) {
            setPathToAutoOpen(unlockedNodeInfo.path);
            setCurrentPage('map');
        }
        closeModal('showNodeUnlockModal');
        setUnlockedNodeInfo(null);
    };
    
    const handleCloseNodeUnlockModal = () => {
        closeModal('showNodeUnlockModal');
        setUnlockedNodeInfo(null);
    };

    const renderPage = () => {
        switch(currentPage) {
            case 'quest': return <DailyQuestScreen />;
            case 'dashboard': return <Dashboard setCurrentPage={setCurrentPage} />;
            case 'journal': return <JournalPage />;
            case 'map': return <WorldMapPage key={mapKey} onNodeClick={setSelectedNode} />;
            default: return <DailyQuestScreen />;
        }
    }

    return (
        <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 min-h-screen">
            <AnimatePresence mode="wait">
                <motion.div key={currentPage} initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2, ease: 'easeInOut' }}>
                    {renderPage()}
                </motion.div>
            </AnimatePresence>
            
            {selectedNode && <NodeModal node={selectedNode} onClose={() => setSelectedNode(null)} />}

            <AnimatePresence>
                {isNavOpen && (
                    <motion.nav key="navbar" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "tween", duration: 0.3, ease: 'easeOut' }} className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm shadow-t-lg border-t border-gray-700 z-40">
                        <div className="container mx-auto flex justify-around p-2">
                            <button onClick={() => setCurrentPage('quest')} className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all ${currentPage === 'quest' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 hover:bg-purple-900/50'}`}><Home size={20}/><span>Quest</span></button>
                            <button onClick={() => setCurrentPage('dashboard')} className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all ${currentPage === 'dashboard' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 hover:bg-purple-900/50'}`}><LayoutDashboard size={20}/><span>Dashboard</span></button>
                            <button onClick={() => { setCurrentPage('map'); setMapKey(Date.now()); }} className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all ${currentPage === 'map' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 hover:bg-purple-900/50'}`}><Map size={20}/><span>Map</span></button>
                            <button onClick={() => setCurrentPage('journal')} className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all ${currentPage === 'journal' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 hover:bg-purple-900/50'}`}><BookText size={20}/><span>Journal</span></button>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
            
            <button onClick={() => setIsNavOpen(!isNavOpen)} className="fixed bottom-4 right-4 z-50 bg-purple-700 text-white p-3 rounded-full shadow-lg hover:bg-purple-600 transition-colors transform hover:scale-110" aria-label={isNavOpen ? 'Hide navigation' : 'Show navigation'}>
                {isNavOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            </button>

            <RewardModal onClose={handleCloseRewardModal} />
            <NodeUnlockModal isOpen={modalState.showNodeUnlockModal} onClose={handleCloseNodeUnlockModal} onConfirm={handleGoToMap} />
            <FitnessUnlockModal isOpen={modalState.showFitnessUnlockModal} onClose={() => closeModal('showFitnessUnlockModal')} />
            <FitnessCompleteModal isOpen={modalState.showFitnessCompleteModal} onClose={() => closeModal('showFitnessCompleteModal')} />
            <JournalModal />
            <JournalDetailModal />
            <ConfirmationModal isOpen={modalState.isDeleteConfirmOpen} onClose={() => closeModal('isDeleteConfirmOpen')} onConfirm={deleteJournalEntry} title="Delete Journal Entry?" message="This action is permanent and cannot be undone. Are you sure?" />
            <ConfirmationModal isOpen={modalState.isEditConfirmOpen} onClose={() => closeModal('isEditConfirmOpen')} onConfirm={confirmEditJournal} title="Edit Entry?" message="Editing this entry will clear its current AI insight. You can generate a new one after saving. Do you want to continue?" />
        </div>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <GameProvider>
                <Toaster position="top-center" reverseOrder={false} />
                <MindQuestApp />
            </GameProvider>
        </AuthProvider>
    );
}
