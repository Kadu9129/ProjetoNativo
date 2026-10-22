# MapPin

Aplicativo de mapa pessoal e privado feito com Expo/React Native para Android, iOS e web. Permite salvar e encontrar lugares sem conta e mantém os dados somente no dispositivo.

## Aula 2 — Implementar e projetar os testes

- Lucas de Souza Cardia — 202312499
- Carlos Eduardo de Oliveira Curti — 202312587

A entrega da P2 está em [docs/aula-2.md](docs/aula-2.md), com RF01, critérios de aceite, integração nativa e roteiro de reprodução. A [planilha de testes](docs/testes/Aula_2_Projeto_e_Documentacao_de_Testes.xlsx) contém 12 casos e três técnicas justificadas. Consulte [execuções e evidências](docs/evidencias/README.md) para os resultados reais: CT04 aprovado na web, CT05 reprovado na reabertura do banco e CT01 bloqueado pelo emulador. Os demais casos de interface estão pendentes; a suíte automatizada complementar tem 20 testes aprovados.

A localização é solicitada pelo botão **Ir para minha localização**, com mensagens para recusa, bloqueio permanente, GPS desligado e timeout. O cadastro manual continua disponível sem permissão.

## Recursos

- cadastro, edição, busca e exclusão de lugares;
- zoom por pinça, roda do mouse e botões `+`/`−`;
- atalhos para localização atual e enquadramento dos marcadores;
- tema claro/escuro;
- armazenamento local com SQLite e funcionamento offline;
- mapa do OpenStreetMap sem chave de API.

## Executar

Requer Node.js 22.5 ou superior e npm.

```bash
npm install
npm run dev:frontend
```

No Expo, pressione `w`, `a` ou `i` para abrir na web, Android ou iOS.

## Builds

```bash
npm run build:web
npm run build:apk
```

O [APK histórico MapPin V1](artifacts/MapPin%20V1.apk) não contém esta atualização da Aula 2. Gere um novo build para testar o código atual em um APK independente do Expo Go. O projeto usa o perfil `preview` de `frontend/eas.json`.

## Offline e privacidade

Os lugares são gravados no banco local `mappin.db` e continuam disponíveis sem internet. Somente o fundo do OpenStreetMap depende de conexão; nenhum marcador é enviado para servidor.

## Verificação

```bash
npm test
npx expo-doctor frontend
npm run build:web
```
