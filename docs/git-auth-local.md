# Autenticación de git en este repositorio (independiente de la cuenta activa de `gh`)

En esta máquina `gh` tiene dos cuentas: `joluigi` (dueña de este repo) y `josevazquez-RL`
(la usa otra sesión en `riselanding-os`, que cambia la cuenta *activa* global). Antes, el push de
este repo usaba la cuenta activa y fallaba con 403 cuando la activa era `josevazquez-RL`.

## Cómo quedó (solo `.git/config` de este repo; la configuración global no se tocó)

```bash
# 1) Vacía, SOLO para github.com y SOLO en este repo, los helpers heredados (gh / osxkeychain)
git config --local --add credential.https://github.com.helper ''
# 2) Helper fijo: siempre entrega el token de joluigi, sin importar la cuenta activa
git config --local --add credential.https://github.com.helper \
  '!f() { test "$1" = get || exit 0; echo username=joluigi; echo "password=$(gh auth token --user joluigi)"; }; f'
```

Comprobar:

```bash
git config --local --get-all credential.https://github.com.helper
git push --dry-run origin HEAD     # "Everything up-to-date" aunque la cuenta activa sea otra
```

Verificado el 1-oct-2026 simulando `josevazquez-RL` como cuenta activa (copia temporal de la
configuración de gh vía `GH_CONFIG_DIR`): push y fetch funcionan con `joluigi`.

- El token sigue en el llavero del sistema (lo administra `gh`); no se escribe en ningún archivo.
- Si `joluigi` cierra sesión en gh (`gh auth logout --user joluigi`), el push fallará con un error
  de credenciales: vuelve a iniciar sesión con `gh auth login`.
- `.git/config` no se versiona: en un clon nuevo hay que repetir los dos comandos.

## Comandos de la CLI `gh` (PRs, etc.)

La CLI `gh` usa la cuenta activa global. Para no depender de ella en este repo:

```bash
GH_TOKEN=$(gh auth token --user joluigi) gh pr create --base main ...
```

## Para deshacerlo

```bash
git config --local --unset-all credential.https://github.com.helper
```
