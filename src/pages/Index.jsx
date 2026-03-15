import BlackHoleSimulation from '../components/BlackHole/BlackHoleSimulation.jsx';

const Index = () => {
  return (
    <div className="font-display relative w-screen h-screen overflow-hidden bg-background">
      <BlackHoleSimulation />
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none select-none">
        <h1 className="text-2xl font-bold tracking-[0.1em] uppercase text-foreground/70">
          Blackhole Simulation
        </h1>
        <p className="text-m mt-1">
          By Team Area 51
        </p>
        <p>&copy; 2026 Developed by Sandeep Pandey.</p>
      </div>
    </div>
  );
};

export default Index;
