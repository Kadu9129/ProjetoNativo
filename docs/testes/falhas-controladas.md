# Roteiro para CT08 e CT12

Estes casos permanecem **não executados na interface** nesta entrega. O roteiro permite repeti-los sem depender de um GPS defeituoso ou de corromper arquivos. Usar uma cópia local de teste do repositório, dados fictícios e `npm run dev:frontend`. Anotar o commit-base e guardar o diff da simulação junto da evidência. A versão testada será esse commit **mais a alteração de simulação**, e não apenas o commit.

## CT08 — erro e demora da localização

Na cópia de teste, localizar `const result = await locateUser(Location);` em `frontend/src/screens/MapScreen.js`. Substituir somente essa chamada por:

```js
const result = await locateUser({
  ...Location,
  getForegroundPermissionsAsync: async () => ({ status: 'granted' }),
  hasServicesEnabledAsync: async () => true,
  getCurrentPositionAsync: async () => {
    throw new Error('Falha GPS simulada para CT08');
  },
});
```

Recarregar o aplicativo, tocar **Ir para minha localização** e observar a mensagem de indisponibilidade, botão liberado e seleção manual disponível. Essa simulação verifica o tratamento da falha; ela não verifica o diálogo real de permissão.

Para a variação de timeout e resposta tardia, substituir apenas `getCurrentPositionAsync` no trecho de simulação por:

```js
getCurrentPositionAsync: () => new Promise((resolve) => {
  setTimeout(() => resolve({
    coords: { latitude: -23.55052, longitude: -46.633308 },
  }), 20000);
}),
```

Recarregar, tocar o botão, aguardar 15 segundos e observar a mensagem de demora. Aguardar mais 5 segundos: a resposta tardia não deve centralizar o mapa nem criar sucesso. Conferir que o formulário manual ainda pode abrir e ser cancelado. Para a variação de coordenada inválida, usar `getCurrentPositionAsync: async () => ({ coords: { latitude: 91, longitude: 0 } })`; o resultado esperado é indisponibilidade.

Restaurar a chamada original `locateUser(Location)`, recarregar e registrar uma nova tentativa com o provedor real. Nunca publicar a simulação como código final.

Os testes de serviço das três situações podem ser repetidos na raiz com:

```bash
node --test frontend/test/locationFlow.test.cjs
```

## CT12 — gravação recusada

Em `frontend/src/services/pinDatabase.js`, na cópia de teste, inserir esta linha como primeira instrução de `createPin(fields)`:

```js
throw new Error('Falha SQLite simulada para CT12.');
```

Isso simula a rejeição da operação antes de qualquer gravação; não reproduz todas as causas possíveis de falha de um dispositivo real.

1. Recarregar o aplicativo e anotar a quantidade de lugares.
2. Abrir **Novo lugar**, preencher `Falha SQLite A2` e `Recuperacao de gravacao`, e confirmar.
3. Registrar mensagem de erro, formulário com os valores preservados e ausência de mensagem de sucesso.
4. Cancelar para conferir contador e busca: o lugar não deve existir.
5. Remover somente a linha de simulação, recarregar e repetir o cadastro com os mesmos dados, uma vez.
6. Verificar exatamente um novo registro na busca e o aumento de um no contador.

Guardar evidências da falha e da recuperação. Não apagar o banco nem mudar permissões de arquivos para induzir o problema. Ao terminar, conferir `git diff` na cópia de teste e remover apenas as alterações temporárias que você introduziu. Uma simulação aprovada comprova tratamento de rejeição, não valida todas as falhas físicas de armazenamento.
