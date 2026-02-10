import Button from '../ui/Button'; // Corrigido: importação default

type BoardControlsProps = {
    onPrev: () => void;
    onToday: () => void;
    onNext: () => void;
};

const BoardControls = ({ onPrev, onToday, onNext }: BoardControlsProps) => {
    return (
        <div className="flex items-center justify-center space-x-2 mb-4">
            <Button onClick={onPrev} variant="outline">Anterior</Button>
            <Button onClick={onToday}>Hoje</Button>
            <Button onClick={onNext} variant="outline">Próximo</Button>
        </div>
    );
};

export default BoardControls; 