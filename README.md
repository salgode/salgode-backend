[![stdVersionB]][stdVersionL]
[![commitsB]][commitsL]
[![prettierB]][prettierL]

# SalgoDe API

API alojada en Amazon Web Services haciendo uso principalmente de API Gateway, Lambda y DynamoDB.
La _landing page_ se encuentra [aquí](https://github.com/salgode/salgode-landing).
La app móvil se encuentra [aquí](https://github.com/salgode/salgode-mobile).
La app web se encuentra [aquí](https://github.com/salgode/salgode-web)

Sigue el desarrollo en [nuestro Trello](https://trello.com/b/GCTJ1iMU/salgode).

## Indice

- [Scripts](#scripts)
- [Workflow](#workflow)
  - [Gitflow](#gitflow)
  - [Release](#release)
- [Motores](#motores)
- [Agradecimientos](#agradecimientos)

## Scripts

- `yarn deploy`

  Sube el código a la función de AWS Lambda correspondiente.

- `yarn lint`

  Corre el verificador de estilos.

- `yarn lint:fix`

  Corrige las fallas de estilos que se pueden corregir automáticamente.

## Workflow

### Development

  - Las ramas `feat/*`, `fix/*`, `chore/*`, `hotfix/*` and `docs/*` se ven bien con `dash-case`.

  - Usamos **squash and merge** a `dev` usando [conventional commits](https://conventionalcommits.org).

### Release

  - Hacemos **merge** de `dev` a `master` localmente.

  - Si el _fast-forward_ no es posible, usamos `prerelease: merge branch 'dev'` como _commit message_.

  - Luego hacemos el _release_ usando [standard version](https://github.com/conventional-changelog/standard-version#installation) con el comando `yarn release`, que se encarga de generar el CHANGELOG de la versión automáticamente y subir los cambios a GitHub con el tag de la nueva versión.

## Motores

  - node ^12.9.1
  - yarn ^1.17.3

## Agradecimientos

Se aprecia el aporte por gestión de equipos a:

- [Matías Andrade](https://github.com/mandrade2)
- [José Morales Lira](https://github.com/josemlira)
- [Franco Méndez Z.](https://github.com/fnmendez)

Se aprecia el aporte por código a:

- [Franco Méndez Z.](https://github.com/fnmendez)
- [Bruno Calderon](https://github.com/brunocalderon)
- [Cristian Eing](https://github.com/cristianeing)
- [Benjamín Benavides](https://github.com/benjavides)
- [Felipe Navarro](https://github.com/fcnavarro)
- [Juanfra Campos](https://github.com/jfcampos1)
- [Domingo Ramírez](https://github.com/chuma9615)
- [Maurice Poirrier](https://github.com/mauricepoirrier)
- [Bernardo Subercaseaux](https://github.com/bsubercaseaux)
- [Antonio Fontaine](https://github.com/afontainec)
- [Diego Bordeu](https://github.com/diegobordeu)
- [Luis Fros](https://github.com/LuisFros)

<!-- BADGES -->

[stdVersionB]:https://img.shields.io/badge/release-standard%20version-blue.svg
[stdVersionL]:https://github.com/conventional-changelog/standard-version

[commitsB]:https://img.shields.io/badge/commits-conventional%20-blue.svg
[commitsL]:https://conventionalcommits.org

[prettierB]:https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[prettierL]:https://github.com/prettier/prettier
