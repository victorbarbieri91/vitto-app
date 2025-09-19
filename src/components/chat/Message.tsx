import type { ChatMessage } from '../../types/chat';

type MessageProps = {
  message: ChatMessage;
};

const Message = ({ message }: MessageProps) => {
  const isAssistant = message.role === 'assistant';

  // Estilos base para o balão da mensagem
  const baseStyles = 'px-4 py-3 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg break-words shadow-sm';

  // Estilos condicionais para o usuário e o assistente
  const assistantStyles = 'bg-gray-100 text-gray-800 rounded-bl-none';
  const userStyles = 'bg-primary text-white rounded-br-none';

  return (
    <div className={`flex w-full my-1 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`${baseStyles} ${isAssistant ? assistantStyles : userStyles}`}>
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

export default Message;
