# MapPin App

Mapa pessoal e privado para web, iOS e Android, desenvolvido com Expo/React Native. O usuário pode guardar lugares importantes, encontrá-los rapidamente e explorar o mapa sem criar conta.

Principais recursos:

- cadastro, edição e exclusão de lugares com nome, descrição e coordenadas;
- zoom por pinça no celular, zoom pela roda do mouse e controles `+`/`−`;
- busca local por nome ou descrição, inclusive sem internet;
- atalhos para voltar à localização atual e enquadrar todos os lugares salvos;
- tema claro/escuro e funcionamento do cadastro totalmente offline.

Todos os lugares são armazenados exclusivamente no dispositivo em um banco SQLite. O aplicativo não possui backend, não usa MongoDB e não envia os dados cadastrados para um servidor. Somente os tiles do OpenStreetMap dependem de um serviço externo e conexão com a internet.

## Requisitos

- Node.js 22.5 ou superior (necessário para os testes de persistência SQLite)
- npm
- Expo Go ou um emulador/dispositivo para os testes móveis

## Instalação e execução

Na raiz do repositório:

```bash
npm install
npm run dev:frontend
```

No terminal do Expo, pressione `w`, `a` ou `i` para abrir o aplicativo na web, Android ou iOS. Nenhum banco externo ou serviço de backend é necessário.

O mapa externo usa OpenStreetMap e não precisa de chave de API, conta ou faturamento. Sem internet, o aplicativo abre uma grade local de coordenadas, mantém os marcadores visíveis e permite todo o CRUD. Os tiles públicos são usados somente para visualização interativa; o aplicativo não faz download em massa nem tenta armazenar áreas completas para uso offline.

O projeto utiliza Expo SDK 54. Caso o Expo Go tenha armazenado um bundle incompatível, feche-o, execute `npx expo start --clear` e leia novamente o QR code.

## Banco de dados local

O banco `mappin.db` é criado automaticamente pelo `expo-sqlite` na primeira abertura. A tabela `pins` guarda:

| Campo | Uso |
| --- | --- |
| `id` | Identificador local único |
| `name` | Nome do lugar |
| `description` | Descrição do lugar |
| `latitude` e `longitude` | Coordenadas do marcador |
| `created_at` e `updated_at` | Datas de criação e atualização |

As operações de cadastrar, consultar, editar e excluir são executadas diretamente nessa tabela. Os dados sobrevivem ao fechamento e à reinicialização do aplicativo.

Ao atualizar uma instalação antiga, os marcadores antes guardados no `AsyncStorage` são importados uma única vez para o SQLite. A preferência de tema continua no `AsyncStorage`, também local ao dispositivo.

## Funcionamento offline

Os marcadores e todas as alterações funcionam sem internet porque o CRUD não depende de API. O fundo cartográfico é externo: sem conexão, tiles ainda não armazenados pelo provedor podem deixar de aparecer, mas os marcadores continuam renderizados sobre a área do mapa e os dados permanecem preservados no SQLite.

A interface mostra separadamente o estado do banco local e o estado do mapa externo. Quando não há internet ou o provedor de tiles falha, o aplicativo informa que o mapa está indisponível e confirma que o CRUD local continua funcionando. Ao detectar a volta da conexão, somente a camada visual do mapa é recarregada; nenhum registro do SQLite é enviado, substituído ou sincronizado.

Roteiro de validação:

1. Abra o aplicativo e cadastre pelo menos dois lugares.
2. Edite um deles e feche completamente o aplicativo.
3. Reabra e confirme que os lugares e a edição continuam presentes.
4. Ative o modo avião, cadastre ou edite outro lugar e reinicie novamente.
5. Confirme o aviso `Sem internet • mapa externo indisponível` e que os marcadores locais continuam acessíveis.
6. Exclua um lugar e confirme que ele não retorna após uma nova abertura.
7. Desative o modo avião e confirme que o mapa externo é recarregado sem alterar os lugares locais.

## Build da web

```bash
npm run build:web
npm run serve:web --workspace frontend
```

O build gera a PWA em `frontend/dist` e o service worker do Workbox. O comando de serviço aplica os cabeçalhos de isolamento exigidos pelo SQLite WebAssembly. Em outra hospedagem, configure `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`. Para instalar a PWA, publique-a em HTTPS ou use `localhost`.

## Gerar o APK

O perfil `preview` do EAS produz um APK instalável:

```bash
npm run build:apk
```

Na primeira execução, autentique-se em uma conta Expo e vincule o projeto quando solicitado. O APK deve ser gerado novamente após alterações em módulos nativos, como a inclusão do SQLite.

O APK atual, já compilado com SQLite e validado em Android, está disponível em `artifacts/MapPin-1.0.0-atualizado.apk`. Confira tamanho, assinatura e SHA-256 em `artifacts/README.md`.

## Estrutura principal

- `frontend/src/services/pinDatabase.js`: criação do banco, migração e CRUD SQLite.
- `frontend/src/hooks/usePins.js`: estado e operações usadas pela interface.
- `frontend/src/hooks/useExternalMapStatus.js`: disponibilidade da internet e recarga exclusiva do mapa externo.
- `frontend/src/services/mapAvailability.js`: regras testáveis para modo avião, falha externa e reconexão.
- `frontend/src/screens/MapScreen.js`: tela principal e feedback de gravação local.
- `frontend/src/components/MapView.*.js`: mapas para web e plataformas nativas.

## Verificação

```bash
npm test
npx expo-doctor frontend
npm run build:web
```

Os testes automatizados simulam o modo avião e a reconexão e usam um arquivo SQLite real para comprovar cadastro, edição e exclusão após fechar e reabrir o banco. No dispositivo, permita o acesso à localização, toque em uma área vazia do mapa, salve um marcador, edite-o pelo balão e teste o roteiro offline acima. Confira também o zoom abrindo e fechando dois dedos sobre pontos diferentes do mapa, a busca por nome/descrição, o botão de localização e o enquadramento de todos os lugares.
