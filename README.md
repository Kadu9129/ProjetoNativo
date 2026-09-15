# MapPin App

Aplicativo único em Expo/React Native para web, iOS e Android, integrado a uma API REST construída com Express e Mongoose. O usuário pode centralizar o mapa em sua localização, criar, editar e excluir lugares com nome e descrição, inclusive sem internet. As alterações são armazenadas no dispositivo e sincronizadas automaticamente quando a conexão retorna.

## Requisitos

- Node.js 20.19 ou superior
- npm
- MongoDB 8 instalado localmente ou uma URI de conexão com MongoDB
- Expo Go ou um simulador nativo para testes em dispositivos móveis

## Instalação

A partir da raiz do repositório:

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Inicie o MongoDB usando uma instalação existente ou o Docker:

```bash
docker compose up -d mongodb
```

## Execução

Abra dois terminais na raiz do repositório. No primeiro, execute o backend:

```bash
npm run dev:backend
```

No segundo, execute o aplicativo:

```bash
npm run dev:frontend
```

No terminal do Expo, pressione `w`, `a` ou `i` para abrir o aplicativo na web, no Android ou no iOS. O endpoint de verificação da API está disponível em `http://localhost:3000/api/health`.

O projeto móvel utiliza o Expo SDK 54 e pode ser aberto diretamente pelo aplicativo público Expo Go. Caso o Expo Go tenha armazenado um bundle antigo e incompatível, feche-o completamente, execute `npx expo start --clear` e escaneie o novo código QR.

A versão web e o simulador de iOS podem usar `EXPO_PUBLIC_API_URL=http://localhost:3000`. Durante o desenvolvimento no Expo Go, o aplicativo substitui automaticamente `localhost` pelo endereço de rede local informado pelo Metro. Em emuladores Android, o endereço alternativo é `http://10.0.2.2:3000`. Também é possível definir explicitamente o endereço de rede do computador em `frontend/.env`.

Na web, o Leaflet utiliza os tiles do OpenStreetMap e exibe a atribuição necessária. As versões nativas usam o mapa da plataforma fornecido pelo `react-native-maps`. A implementação `UrlTile` dessa biblioteca não consegue atender aos requisitos de identificação e cache do serviço comunitário `tile.openstreetmap.org` e, por isso, não aponta para esse serviço.

## Build da PWA

```bash
npm run build:web
npx serve frontend/dist
```

O build exporta o aplicativo web do Expo e gera o arquivo `frontend/dist/sw.js` com o Workbox. Teste a instalação usando uma publicação segura com HTTPS ou por meio de `localhost`. O service worker armazena previamente os arquivos essenciais do aplicativo. Os lugares ficam no armazenamento local; os tiles ainda dependem do cache do provedor do mapa e a sincronização com a API exige conexão.

Ao substituir uma versão de desenvolvimento instalada anteriormente, limpe uma vez os dados armazenados pelo site no navegador. O modo de desenvolvimento remove automaticamente os service workers de produção, evitando que um bundle antigo em cache impeça a exibição da interface.

## API

| Método | Endpoint | Resultado |
| --- | --- | --- |
| `GET` | `/api/health` | Estado do serviço |
| `GET` | `/api/pins` | Todos os marcadores, do mais recente para o mais antigo |
| `POST` | `/api/pins` | Cria um marcador validado |
| `PUT` | `/api/pins/:id` | Atualiza um marcador validado |
| `DELETE` | `/api/pins/:id` | Exclui um marcador |

Exemplo de payload para criação:

```json
{
  "name": "Praia de Saquarema",
  "description": "Ótimo lugar para surfar ao nascer do sol",
  "latitude": -22.9199,
  "longitude": -42.5083,
  "clientId": "identificador-gerado-pelo-aplicativo"
}
```

O `clientId` torna a criação idempotente: se a resposta se perder durante uma sincronização, repetir a operação não cria um marcador duplicado.

## Offline First e sincronização

O aplicativo grava primeiro no `AsyncStorage`. Criar, editar e excluir funcionam sem acesso à API e sobrevivem ao fechamento do aplicativo. Cada mudança gera uma operação persistente na fila local. O indicador abaixo do logotipo informa se o app está online, offline, sincronizando ou com operações pendentes.

Quando a rede retorna, a fila é enviada automaticamente na ordem em que foi criada e a lista mais recente é buscada no MongoDB. O indicador de conexão também funciona como botão para iniciar uma sincronização manual.

### Roteiro de demonstração offline

1. Com internet, abra o aplicativo e crie um lugar.
2. Ative o modo avião e confirme o indicador `Offline`.
3. Crie um segundo lugar e edite o primeiro. Os dois permanecem utilizáveis.
4. Feche e reabra o aplicativo ainda offline para comprovar a persistência local.
5. Desative o modo avião. Aguarde a mensagem de alterações sincronizadas.
6. Reinicie o app ou pressione o indicador de conexão para comprovar que os dados chegaram à API.

## Gerar o APK

O perfil `preview` do EAS está configurado para produzir um APK instalável, em vez de um Android App Bundle:

```bash
npm run build:apk
```

Na primeira execução, autentique-se em uma conta Expo e vincule o projeto quando solicitado. Ao final, o EAS fornece o link para baixar o `.apk`. Guarde uma cópia do arquivo junto aos artefatos da apresentação.

Um APK local de demonstração também está disponível em `artifacts/MapPin-1.0.0.apk`. Ele é assinado com uma chave de desenvolvimento e serve para instalação direta e apresentação; uma publicação em loja deve usar uma chave de produção protegida.

## Verificação

```bash
npm test
```

Depois de instalar as dependências, verifique o bundle de produção da PWA com `npm run build:web`. No celular, permita o acesso à localização durante o uso, toque em uma área vazia do mapa, salve um marcador, edite-o pelo balão, teste o roteiro offline, alterne o tema e exclua o marcador.
