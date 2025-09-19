// Componente de teste para verificar a renderização

export default function TestApp() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Teste de Renderização React</h1>
      <p className="text-lg mb-4">Se você está vendo esta página, o React está funcionando corretamente.</p>
      <div className="bg-green-100 p-4 rounded-lg border border-green-300">
        <p className="text-green-700">O problema pode estar em outro componente ou na configuração da aplicação.</p>
      </div>
    </div>
  );
}
