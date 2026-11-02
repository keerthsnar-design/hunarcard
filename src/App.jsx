import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoBanner from './components/DemoBanner';
import Home from './pages/Home';
import CreateCard from './pages/CreateCard';
import WorkProof from './pages/WorkProof';
import MyCard from './pages/MyCard';
import PublicCard from './pages/PublicCard';
import FindWorkers from './pages/FindWorkers';

export default function App() {
  return (
    <div className="app-container">
      <DemoBanner />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateCard />} />
          <Route path="/work-proof/:cardId" element={<WorkProof />} />
          <Route path="/my-card" element={<MyCard />} />
          <Route path="/card/:id" element={<PublicCard />} />
          <Route path="/find" element={<FindWorkers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
