// Script para configurar regras do Firestore
// Execute este script para configurar as permissões necessárias

console.log('🔧 Configuração das Regras do Firestore');
console.log('=====================================');
console.log('');
console.log('Para configurar as regras do Firestore e permitir o acesso aos lançamentos:');
console.log('');
console.log('1. Acesse o Firebase Console: https://console.firebase.google.com/');
console.log('2. Selecione o projeto: sistema-ideal-dbffd');
console.log('3. Vá em "Firestore Database" no menu lateral');
console.log('4. Clique na aba "Regras" (Rules)');
console.log('5. Substitua o conteúdo atual pelas regras abaixo:');
console.log('');
console.log('=== REGRAS DO FIRESTORE ===');
console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso aos lançamentos para usuários autenticados
    match /lancamentos/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Permitir acesso aos usuários para usuários autenticados
    match /usuarios/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Permitir acesso a outras coleções existentes
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
`);
console.log('=== FIM DAS REGRAS ===');
console.log('');
console.log('6. Clique em "Publicar" para aplicar as regras');
console.log('7. Aguarde alguns segundos para as regras serem aplicadas');
console.log('');
console.log('✅ Após aplicar as regras, o sistema de lançamentos funcionará corretamente!');
console.log('');
console.log('📋 Estrutura da coleção "lancamentos":');
console.log('- descricao: string (obrigatório)');
console.log('- valor: number (obrigatório)');
console.log('- tipo: "RECEITA" ou "DESPESA" (obrigatório)');
console.log('- unidade: string (obrigatório)');
console.log('- categoria: string (opcional)');
console.log('- formaPagamento: string (opcional)');
console.log('- observacoes: string (opcional)');
console.log('- dataLancamento: timestamp');
console.log('- dataCriacao: timestamp');
console.log('- status: "ATIVO"');
console.log('- criadoPor: uid do usuário');
console.log('- emailCriador: email do usuário'); 