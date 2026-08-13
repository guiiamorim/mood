# mood

`mood` troca o wallpaper do Ubuntu/GNOME usando a API do Unsplash, mantém uma classe de luminosidade por sessão e oferece controles no menu de configurações rápidas.

## Instalação

Crie uma Access Key no painel de desenvolvedores do Unsplash e execute em um terminal:

```bash
./install.sh
```

Dependências do Ubuntu: `curl`, `jq`, `imagemagick`, `gsettings`, `systemd`, `gjs` e `gnome-extensions`. Em uma instalação mínima, elas podem ser obtidas com:

```bash
sudo apt install curl jq imagemagick gnome-shell gjs
```

O instalador grava a chave em `~/.config/mood/config`, instala o comando em `~/.local/bin/mood`, habilita o timer horário e instala a extensão GNOME `mood@local`. Pode ser necessário sair e entrar na sessão uma vez para o Shell carregar a extensão.

O instalador tenta registrar a extensão via `gnome-extensions install` e mantém um fallback na pasta per-user suportada (`~/.local/share/gnome-shell/extensions/mood@local`) para versões do Ubuntu em que o instalador de bundles falha.

O primeiro wallpaper é aplicado imediatamente durante a instalação. Nos boots seguintes, a primeira tentativa ocorre cerca de 10 segundos depois que a sessão gráfica fica disponível; as próximas ocorrem a cada hora.

## Comandos

```text
mood run
mood next
mood set-topic "cinematic neon city"
mood set-scheme auto|light|dark
mood status
mood topics
mood uninstall
```

Durante o desenvolvimento, os mesmos comandos podem ser chamados como `./mood status` a partir deste diretório.

O modo `auto` calcula a luminosidade pela imagem escolhida; `light` e `dark` aplicam imediatamente o esquema correspondente e buscam uma imagem compatível.
