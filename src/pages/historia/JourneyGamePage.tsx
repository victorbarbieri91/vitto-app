import JourneyCanvas from '../../game/JourneyCanvas';

const JourneyGamePage = () => {
  return (
    <div className="w-full h-full flex flex-col p-4">
      <h1 className="text-xl font-semibold text-slate-700 mb-4">Mini Game - Prova de Conceito</h1>
      <div className="flex-grow w-full">
        <JourneyCanvas />
      </div>
    </div>
  );
};

export default JourneyGamePage; 