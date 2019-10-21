<!-- [![travisB]][travisL] -->
[![stdVersionB]][stdVersionL]
[![commitsB]][commitsL]
[![prettierB]][prettierL]

# Salgode API

API alojada en Amazon Web Services haciendo uso de API Gateway, Lambda y DynamoDB.
Frontend se encuentra [aquí](https://github.com/Varuscl/salgode/).

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

Se aprecia el aporte al backend de:

- [Franco Méndez Z.](https://github.com/fnmendez)
- [Matías Andrade](https://github.com/mandrade2)
- [José Morales Lira](https://github.com/josemlira)
- [Domingo Ramírez](https://github.com/chuma9615)
- [Maurice Poirrier](https://github.com/mauricepoirrier)
- [Felipe Navarro](https://github.com/fcnavarro)
- [Bernardo Subercaseaux](https://github.com/bsubercaseaux)

<!-- BADGES -->

<!-- [travisB]:https://travis-ci.com/
[travisL]:https://travis-ci.com/ -->

[stdVersionB]:https://img.shields.io/badge/release-standard%20version-blue.svg
[stdVersionL]:https://github.com/conventional-changelog/standard-version

[commitsB]:https://img.shields.io/badge/commits-conventional%20-blue.svg
[commitsL]:https://conventionalcommits.org

[prettierB]:https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[prettierL]:https://github.com/prettier/prettier
