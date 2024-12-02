# CookNexus

Esta é uma API RESTful desenvolvida com **Node.js**, **Express**, e **Knex.js** para gerenciar receitas, ingredientes e usuários. A API permite realizar operações de CRUD (Criar, Ler, Atualizar, Excluir), com autenticação baseada em token JWT e validações para garantir a integridade dos dados.


## Documentação do Postman disponível em: https://elements.getpostman.com/redirect?entityId=37745648-03ccd663-9d9c-4c0d-9d35-d3809b81b0d8&entityType=collection

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript do lado do servidor.
- **Express**: Framework web para construção de APIs.
- **Knex.js**: Construtor SQL para facilitar a interação com o banco de dados.
- **Bcrypt.js**: Biblioteca para criptografar senhas.
- **JWT (JSON Web Tokens)**: Para autenticação e autorização.
- **PostgreSQL**: Banco de dados relacional.

## Instalação

### Requisitos

- Node.js (versão 14 ou superior)
- PostgreSQL (ou outro banco de dados relacional configurado para uso)

### Passos para Instalação

1. **Clone este repositório**:
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    ```

2. **Acesse o diretório do projeto**:
    ```bash
    cd seu-repositorio
    ```

3. **Instale as dependências**:
    ```bash
    npm install
    ```

4. **Crie o arquivo `.env`** para configurar as variáveis de ambiente. Exemplo:
    ```bash
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=seu_usuario
    DB_PASSWORD=sua_senha
    DB_NAME=nome_do_banco
    JWT_SECRET=sua_chave_secreta
    ```

5. **Configure o banco de dados**: 
    Utilize o Knex.js ou migrações personalizadas para criar as tabelas necessárias.

6. **Inicie o servidor**:
    ```bash
    npm start
    ```

## Contribuição

Contribuições são bem-vindas! Se você deseja contribuir para este projeto, siga os passos abaixo:

### Passos para Contribuir

1. **Faça um Fork do repositório**
   - Clique no botão "Fork" no canto superior direito da página do repositório no GitHub. Isso criará uma cópia do repositório no seu perfil. Com isso, você poderá trabalhar nas suas mudanças sem afetar o repositório principal.

2. **Clone seu Fork**
   - Após fazer o fork, clone o repositório para a sua máquina local com o seguinte comando:
     ```bash
     git clone https://github.com/seu-usuario/seu-repositorio.git
     ```
   - Isso cria uma cópia local do repositório no seu computador para que você possa trabalhar offline.

3. **Crie uma Branch para a Sua Feature ou Correção**
   - Antes de começar a trabalhar nas suas alterações, crie uma nova branch para a feature ou correção que você deseja implementar:
     ```bash
     git checkout -b nome-da-sua-feature
     ```
   - Criar uma branch separada ajuda a manter o código organizado e facilita a colaboração, pois as alterações ficam isoladas em uma branch específica.

4. **Faça as Alterações**
   - Realize as mudanças necessárias no código. Isso pode incluir a implementação de novas funcionalidades, correção de bugs, ou melhorias no desempenho.

5. **Teste suas Alterações**
   - Antes de fazer o commit, execute os testes ou verifique o funcionamento da aplicação localmente para garantir que suas alterações não quebrem nada:
     ```bash
     npm run test
     ```
   - Testar o código é uma etapa importante para garantir que suas alterações funcionem corretamente e que o projeto continue estável.

6. **Commit suas Alterações**
   - Após testar suas alterações, faça o commit com uma mensagem clara e descritiva:
     ```bash
     git add .
     git commit -m "Descrição clara das mudanças"
     ```
   - O comando `git add .` adiciona todas as alterações ao commit, e `git commit` grava essas mudanças no histórico de versões. Certifique-se de que a mensagem de commit seja explicativa, para que outros colaboradores entendam o que foi feito.

7. **Push sua Branch**
   - Envie suas alterações para o repositório remoto no GitHub:
     ```bash
     git push origin nome-da-sua-feature
     ```
   - Esse comando envia sua branch com as mudanças para o GitHub, tornando-as acessíveis para os mantenedores do repositório.

8. **Abra um Pull Request**
   - Acesse o repositório original e abra um Pull Request (PR). Isso permitirá que seus colaboradores revisem suas alterações e, se tudo estiver correto, elas serão integradas ao projeto principal.
   - O Pull Request é a maneira formal de propor as alterações para o repositório principal. A revisão do código é uma etapa importante para garantir que as alterações estejam corretas.

### O que Você Pode Fazer

- **Relatar Bugs**: Se você encontrar algum erro ou problema, abra uma **issue** no GitHub detalhando o que ocorreu.
- **Adicionar Novos Recursos**: Se você tem uma ideia de melhoria ou uma nova funcionalidade, crie uma branch, faça as mudanças e envie um Pull Request.
- **Melhorar a Documentação**: Caso perceba algo na documentação que possa ser melhorado ou mais detalhado, contribua para que outros desenvolvedores possam entender melhor o projeto.

### Diretrizes para Contribuição

- **Mensagens de Commit**: Seja claro e específico nas mensagens de commit. Descreva exatamente o que foi alterado e por que.
- **Testes**: Sempre adicione ou atualize os testes, quando necessário, para garantir que a nova funcionalidade ou correção funcione corretamente.
- **Código Limpo**: Certifique-se de que o código esteja legível, seguindo as convenções do projeto e sem erros antes de enviar um Pull Request.


