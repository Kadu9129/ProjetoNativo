# Execuções da Aula 2

Data: **22/10/2026**, fuso **America/Sao_Paulo**. As execuções abaixo foram conduzidas pelo **Codex**, com ações passo a passo na interface. Não são execuções realizadas por Lucas ou Carlos. A dupla deve repetir os testes na apresentação e completar os pendentes.

| Execução | Caso | Ambiente e versão | Situação |
| --- | --- | --- | --- |
| EX01 | CT01 | Medium_Phone, Android 17/API 37 x86_64, Expo Go instalado pelo Expo CLI SDK 54. Código `6343d113f2dd19dcb94407bebcee2d463f9a9d83`, MapPin 1.0.0. | Bloqueado |
| EX04 | CT04 | Windows, navegador interno Chromium 155.0.0.0, `http://localhost:4173`. Código `8d7bf3f6e1e322cf9d91f9b482909091abdd586d`, MapPin 1.0.0 web. | Aprovado |
| EX05 | CT05 | Mesmo ambiente e commit de EX04. | Reprovado — DF01 |

EX02, EX03 e EX06 a EX12 estão reservadas para os casos correspondentes e constam como **Não executado** na planilha. Não há data, dispositivo ou executor inventados para essas linhas. Reexecuções devem receber outro ID, começando por EX13, mantendo as linhas anteriores.

## EX01 — tentativa no Android

Comando: `npx expo start --android --localhost --port 8081 --max-workers 2`, executado em `frontend/`. O Metro compilou o bundle Android com 997 módulos. O emulador recebeu posição simulada (longitude -46.633308, latitude -23.55052), mas o Expo Go apresentou “isn't responding” e não permitiu concluir o fluxo. A tentativa foi encerrada. Não foi aprovada nenhuma integração nativa nesta execução.

Evidência: [bloqueio do Expo Go](EX01_CT01_bloqueio_android.png). Limitação de ambiente; não confirma um defeito do MapPin. Próximo passo: repetir o CT01 em aparelho físico ou emulador responsivo compatível.

## EX04 — campos obrigatórios e recuperação

Quantidade inicial: **0 lugares**. Coordenada fictícia selecionada no mapa: **-36.03133, -49.21875**.

1. Nome vazio e descrição `Descricao valida`: erro “Nome e descrição são obrigatórios.”; formulário permanece aberto.
2. Nome `Nome Valido A2` e descrição vazia: mesmo erro; sem gravação.
3. Ambos os campos com três espaços: mesmo erro; sem gravação.
4. Corrigir para `Nome Valido A2` / `Descricao valida` e confirmar: formulário fecha, aparece a confirmação e contador muda para **1**.
5. Buscar `Nome Valido A2`: um resultado com a descrição correta.

Evidências: [erro de validação](EX04_CT04_campos_invalidos.jpg) e [registro salvo na busca](EX04_CT04_correcao_salva.jpg). Situação: **Aprovado na web**. Não substitui uma execução em Android/iOS.

## EX05 — cancelar edição e reabrir

Preparação: criar `Original A2` / `Descricao original` em **-44.08759, 38.67188**. Contador inicial do caso: **2 lugares**.

1. Abrir o marcador e editar para `Alterado A2` / `Descricao alterada`.
2. Cancelar e reabrir a edição: os valores originais e a coordenada foram preservados, com contador 2.
3. Fechar a aba e abrir novamente a aplicação: apareceu “Não foi possível abrir o banco de dados local.” e contador 0. Buscar `Original A2` não retornou resultado nessa condição.
4. Acionar “Tentar novamente”: apareceu “Não foi possível ler o banco de dados local.”.
5. Durante o diagnóstico, recarregar a página: os dois registros voltaram a ser lidos. O marcador `Original A2` manteve nome, descrição e coordenada anteriores.

Evidências: [rascunho](EX05_CT05_rascunho.jpg), [original após cancelar](EX05_CT05_original_preservado.jpg), [falha na reabertura](EX05_CT05_banco_indisponivel.jpg) e [dados recuperados após reload](EX05_CT05_recuperado_apos_reload.jpg).

**Resultado completo: Reprovado. DF01 aberto.** A falha de reabertura permanece em investigação. Não foi confirmada perda definitiva dos dados. O navegador fornecia `SharedArrayBuffer` e isolamento de origem; a causa da falha não foi determinada. O diagnóstico temporário do navegador foi desligado ao terminar. Não há commit de correção nem reexecução de validação.

## Verificações automatizadas complementares

- **AT01:** `npm test`, 20 testes aprovados e zero falhas. [Saída real do comando](AT01_testes_automatizados.txt). Abrange validação, limites, simulação do provedor de localização, SQLite de teste em Node e disponibilidade do mapa. O aviso de SQLite experimental é emitido pelo Node.
- **AT02:** `npx expo export --platform web --max-workers 2`, concluído com 584 módulos; `npx workbox generateSW workbox-config.js`, concluído com 20 URLs no pré-cache. O Metro informou avisos de imagens referenciadas pelo CSS do Leaflet. Não foram tratados como falha de compilação. A aplicação carregou e os marcadores próprios foram observados no navegador.
- A geração de um bundle Android não comprova a execução do fluxo no emulador. Os testes em Node não comprovam o comportamento do GPS nem dos diálogos nativos.

## Para continuar o registro

Usar dados fictícios e uma instalação de teste. Registrar o commit, o ambiente, o executor real, os passos executados e a evidência. Corrigir DF01 somente após identificar a causa; depois executar novamente CT05 e CT11, preservando EX05. Capturas devem usar `EXxx_CTxx_descricao.png` ou `.jpg`. Não incluir credenciais ou coordenadas pessoais.
