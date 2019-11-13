# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/salgode/salgode-backend/compare/v1.1.0...v1.2.0) (2019-11-13)


### Bug Fixes

* **create_driver_trip:** bad request status code ([61ebea9](https://github.com/salgode/salgode-backend/commit/61ebea9))
* filter completed trips ([f1744c1](https://github.com/salgode/salgode-backend/commit/f1744c1))


### Features

* **authorizer:** restrict users with no email verification ([0e4e379](https://github.com/salgode/salgode-backend/commit/0e4e379))
* **create_driver_trip:** add robustness against unexistent resources ([4424fb8](https://github.com/salgode/salgode-backend/commit/4424fb8))
* **create_driver_trip:** allow without driver license verification ([e56208c](https://github.com/salgode/salgode-backend/commit/e56208c))
* **create_driver_trip:** forbid without verified driver license ([3ccddf8](https://github.com/salgode/salgode-backend/commit/3ccddf8))
* **create_driver_trip:** remove driver license validation ([ebf6ec3](https://github.com/salgode/salgode-backend/commit/ebf6ec3))
* **create_driver_trip:** validate driver license verified ([3fbc4b3](https://github.com/salgode/salgode-backend/commit/3fbc4b3))
* **download_unverified_images:** add endpoint for manual image verification ([d219862](https://github.com/salgode/salgode-backend/commit/d219862))
* **download_unverified_images:** add field parameter ([bf0db6b](https://github.com/salgode/salgode-backend/commit/bf0db6b))
* **forward_driver_trip:** validate trip consistency ([74d1b38](https://github.com/salgode/salgode-backend/commit/74d1b38))
* **get_driver_trip:** send current point ([1e2b206](https://github.com/salgode/salgode-backend/commit/1e2b206))
* **review_user_image:** add image manual review endpoint ([c69bc82](https://github.com/salgode/salgode-backend/commit/c69bc82))
* **start_driver_trip:** validate no in progress trip ([9e3c3c9](https://github.com/salgode/salgode-backend/commit/9e3c3c9))
* **user:** add check images field ([85d0aea](https://github.com/salgode/salgode-backend/commit/85d0aea))
* **verify_user_image:** add image manual verification endpoint ([cef754c](https://github.com/salgode/salgode-backend/commit/cef754c))

## [1.1.0](https://github.com/salgode/salgode-backend/compare/v1.0.0...v1.1.0) (2019-11-07)


### Bug Fixes

* **authorizer:** rewrote functions to use context authorization info ([#20](https://github.com/salgode/salgode-backend/issues/20)) ([b7672a3](https://github.com/salgode/salgode-backend/commit/b7672a3))
* **create_user:** add selfie key to verifications ([35e3705](https://github.com/salgode/salgode-backend/commit/35e3705))
* **create_user:** set null value if missing key in body ([0695832](https://github.com/salgode/salgode-backend/commit/0695832))
* **create_user_vehicle:** add vehicle id to user ([e066d57](https://github.com/salgode/salgode-backend/commit/e066d57))
* **get_driver_trip:** change null response to empty object ([f82099a](https://github.com/salgode/salgode-backend/commit/f82099a))
* **get_driver_trip_manifest:** fix when no reservations and add robustness ([f1666ee](https://github.com/salgode/salgode-backend/commit/f1666ee))
* **get_passenger_reservations:** places order consistency ([99346b2](https://github.com/salgode/salgode-backend/commit/99346b2))
* **get_trips_open:** avatar url ([748f1d8](https://github.com/salgode/salgode-backend/commit/748f1d8))
* **get_user:** retrieve verifications correctly ([ae777dd](https://github.com/salgode/salgode-backend/commit/ae777dd))
* **get_user_current_trip:** trip status was not only in progress ([c07f6ef](https://github.com/salgode/salgode-backend/commit/c07f6ef))
* **get_user_self:** key name in verifications ([90c2e9d](https://github.com/salgode/salgode-backend/commit/90c2e9d))
* **get_user_vehicle:** remove logs ([f034417](https://github.com/salgode/salgode-backend/commit/f034417))
* **login_user:** retrieve real verifications ([b4e1991](https://github.com/salgode/salgode-backend/commit/b4e1991))
* **passenger_reservations:** route key names ([c8d4c2a](https://github.com/salgode/salgode-backend/commit/c8d4c2a))
* **search_trips_by_place_intersection:** no error on empty trips ([8080825](https://github.com/salgode/salgode-backend/commit/8080825))
* **search_trips_by_place_intersection:** parse response as docs ([73ee69c](https://github.com/salgode/salgode-backend/commit/73ee69c))
* **update_user_self:** add email and phone to verifications ([3d43343](https://github.com/salgode/salgode-backend/commit/3d43343))
* **update_user_self:** add robustness against bad request ([90546b0](https://github.com/salgode/salgode-backend/commit/90546b0))
* **update_user_self:** selfie_image updateable ([cca9f9e](https://github.com/salgode/salgode-backend/commit/cca9f9e))
* **update_user_vehicle:** fix resource name on event creation ([18efe5b](https://github.com/salgode/salgode-backend/commit/18efe5b))
* **user:** add important robustness against unexistent image ids ([45207ee](https://github.com/salgode/salgode-backend/commit/45207ee))


### Chore

* remove unused function ([1e32bac](https://github.com/salgode/salgode-backend/commit/1e32bac))
* rename function ([4a0878f](https://github.com/salgode/salgode-backend/commit/4a0878f))
* **create_user_vehicle:** remove logs ([eb5867b](https://github.com/salgode/salgode-backend/commit/eb5867b))


### Docs

* add landing page and update collaborators ([0f7d010](https://github.com/salgode/salgode-backend/commit/0f7d010))


### Features

* **complete_driver_trip:** do not increase current point and handle error response ([239b266](https://github.com/salgode/salgode-backend/commit/239b266))
* **create_driver_trip:** force required parameters ([ce17c72](https://github.com/salgode/salgode-backend/commit/ce17c72))
* **create_driver_trip:** validate etd not passed ([5d38a22](https://github.com/salgode/salgode-backend/commit/5d38a22))
* **create_user:** add create event for security ([1681c2d](https://github.com/salgode/salgode-backend/commit/1681c2d))
* **create_user:** add user verifications ([eb900c0](https://github.com/salgode/salgode-backend/commit/eb900c0))
* **create_user_vehicle:** add validations ([41c428a](https://github.com/salgode/salgode-backend/commit/41c428a))
* **create_user_vehicle:** add verifications ([257398c](https://github.com/salgode/salgode-backend/commit/257398c))
* **driver_trips:** add privacy for driver ([621617b](https://github.com/salgode/salgode-backend/commit/621617b))
* **get_driver_reservations:** retrieve only pending reservations ([51f76e3](https://github.com/salgode/salgode-backend/commit/51f76e3))
* **get_driver_trip:** add next point information ([06669e2](https://github.com/salgode/salgode-backend/commit/06669e2))
* **get_driver_trip_manifest:** add images urls ([497da8a](https://github.com/salgode/salgode-backend/commit/497da8a))
* **get_driver_trip_manifest:** add privacy for driver ([aadd0fe](https://github.com/salgode/salgode-backend/commit/aadd0fe))
* **get_passenger_reservations:** add key names consistency and info details ([c61236f](https://github.com/salgode/salgode-backend/commit/c61236f))
* **get_passenger_reservations:** add trip status ([1109c57](https://github.com/salgode/salgode-backend/commit/1109c57))
* **get_trips_open:** add get open trips function with query limit ([5a5ff09](https://github.com/salgode/salgode-backend/commit/5a5ff09))
* **get_trips_open:** do not retrieve trips without available seats ([a71d5d6](https://github.com/salgode/salgode-backend/commit/a71d5d6))
* **get_user_self:** retrieve images url and verifications ([c2453ad](https://github.com/salgode/salgode-backend/commit/c2453ad))
* **login_user:** add vehicles on response ([d0e7c8a](https://github.com/salgode/salgode-backend/commit/d0e7c8a))
* **login_user:** send 401 if email not exists ([dc003de](https://github.com/salgode/salgode-backend/commit/dc003de))
* **profile:** retrieve full vehicles info ([651dc6f](https://github.com/salgode/salgode-backend/commit/651dc6f))
* **request_reservation:** add validations ([cf8425b](https://github.com/salgode/salgode-backend/commit/cf8425b))
* **request_reservation:** allow duplicated request if other was canceled ([b57cd4f](https://github.com/salgode/salgode-backend/commit/b57cd4f))
* **request_reservations:** restrict own trip and duplicated ([dad8888](https://github.com/salgode/salgode-backend/commit/dad8888))
* **search_trips:** add user images and verifications and filter trips without available seats ([871c0c9](https://github.com/salgode/salgode-backend/commit/871c0c9))
* **search_trips_by_place_intersection:** add vehicle_verifications ([325045c](https://github.com/salgode/salgode-backend/commit/325045c))
* **trips:** don't show self trips ([bc1629b](https://github.com/salgode/salgode-backend/commit/bc1629b))
* **trips:** filter already requested trips ([10ef315](https://github.com/salgode/salgode-backend/commit/10ef315))
* **trips:** get and search trips filtered by date ([5dcbece](https://github.com/salgode/salgode-backend/commit/5dcbece))
* **trips:** retrieve empty array if there are no trips ([1b9607c](https://github.com/salgode/salgode-backend/commit/1b9607c))
* **trips:** retrieve places real key names ([f865c51](https://github.com/salgode/salgode-backend/commit/f865c51))
* **trips:** retrieve trips ordered by lower etd ([2d6bc0a](https://github.com/salgode/salgode-backend/commit/2d6bc0a))
* **update_user_self:** add robustness ([3a6d1d5](https://github.com/salgode/salgode-backend/commit/3a6d1d5))
* **update_user_self:** add working and consistent function ([5477d5e](https://github.com/salgode/salgode-backend/commit/5477d5e))
* **update_user_self:** reset verification when identification updated ([31b6a27](https://github.com/salgode/salgode-backend/commit/31b6a27))
* **user:** add email confirmation ([d8a012f](https://github.com/salgode/salgode-backend/commit/d8a012f))
* **user_verifications:** retrieve user verifications ([2501d9d](https://github.com/salgode/salgode-backend/commit/2501d9d))


### Refactor

* **create_user:** change to transact items ([0845c76](https://github.com/salgode/salgode-backend/commit/0845c76))
* **update_user_vehicle:** use transact for updating vehicle and creating event ([84bd3ac](https://github.com/salgode/salgode-backend/commit/84bd3ac))


### Style Improvements

* **get_passenger_reservations:** add eslint comment ([715ad70](https://github.com/salgode/salgode-backend/commit/715ad70))
* add import styling plugin ([eff4b16](https://github.com/salgode/salgode-backend/commit/eff4b16))
* lint fix ([d833504](https://github.com/salgode/salgode-backend/commit/d833504))

## [1.0.0](https://github.com/salgode/salgode-backend/compare/v0.0.2...v1.0.0) (2019-10-28)


### Bug Fixes

* **accept_reservations:** parse body properly ([8c170ca](https://github.com/salgode/salgode-backend/commit/8c170ca))
* **complete_driver_trip:** parse body as expected ([76a05f6](https://github.com/salgode/salgode-backend/commit/76a05f6))
* **create_driver_trip:** add etd info key ([d9911e0](https://github.com/salgode/salgode-backend/commit/d9911e0))
* **create_driver_trip:** change etd key name and parse body as expected ([052a940](https://github.com/salgode/salgode-backend/commit/052a940))
* **create_driver_trip:** move to new endpoint ([f846f4d](https://github.com/salgode/salgode-backend/commit/f846f4d))
* **create_user:** add images url from database ([85e4610](https://github.com/salgode/salgode-backend/commit/85e4610))
* **create_user:** create response ([49b7b7b](https://github.com/salgode/salgode-backend/commit/49b7b7b))
* **current_trip:** add missing response params ([6eb0149](https://github.com/salgode/salgode-backend/commit/6eb0149))
* **current_trip:** expected accepted reservations ([c611e91](https://github.com/salgode/salgode-backend/commit/c611e91))
* **decline_reservation:** parse body accordingly ([11ffe59](https://github.com/salgode/salgode-backend/commit/11ffe59))
* **eslint:** aws-sdk ([2d3b878](https://github.com/salgode/salgode-backend/commit/2d3b878))
* **forward_driver_trip:** add next point and make it robust ([69cba8c](https://github.com/salgode/salgode-backend/commit/69cba8c))
* **forward_driver_trip:** parse body as expected ([2c590f6](https://github.com/salgode/salgode-backend/commit/2c590f6))
* **get_driver_reservations:** added functions and refactored code ([#19](https://github.com/salgode/salgode-backend/issues/19)) ([0a6cc2b](https://github.com/salgode/salgode-backend/commit/0a6cc2b))
* **get_driver_trips:** add missing vehicle attributes ([af8218f](https://github.com/salgode/salgode-backend/commit/af8218f))
* **get_driver_trips:** fix some key names ([68479fc](https://github.com/salgode/salgode-backend/commit/68479fc))
* **get_passenger_reservations:** added functions and refactored code ([#17](https://github.com/salgode/salgode-backend/issues/17)) ([374bfdd](https://github.com/salgode/salgode-backend/commit/374bfdd))
* **get_passenger_reservations:** added functions and refactored code ([#18](https://github.com/salgode/salgode-backend/issues/18)) ([5057d50](https://github.com/salgode/salgode-backend/commit/5057d50))
* **get_passenger_trips:** add missing vehicle attributes ([b393f18](https://github.com/salgode/salgode-backend/commit/b393f18))
* **get_passenger_trips:** robust against repeated drivers ([cd67a06](https://github.com/salgode/salgode-backend/commit/cd67a06))
* **get_passenger_trips:** robust against repeated vehicles ([0241b9f](https://github.com/salgode/salgode-backend/commit/0241b9f))
* **get_places:** parse response ([eda2f44](https://github.com/salgode/salgode-backend/commit/eda2f44))
* **get_trip:** code fix ([e7e7e31](https://github.com/salgode/salgode-backend/commit/e7e7e31))
* **get_trips:** available trips only ([6369d5d](https://github.com/salgode/salgode-backend/commit/6369d5d))
* **get_user:** adapt to new user images structure ([b3467d5](https://github.com/salgode/salgode-backend/commit/b3467d5))
* **get_user_current_trip:** response ([5c95256](https://github.com/salgode/salgode-backend/commit/5c95256))
* **get_user_self:** correct response code ([c5fb3fa](https://github.com/salgode/salgode-backend/commit/c5fb3fa))
* **get_user_self:** getting the user id from the correct place ([c40d7fb](https://github.com/salgode/salgode-backend/commit/c40d7fb))
* **get_user_self:** response ([ec010d6](https://github.com/salgode/salgode-backend/commit/ec010d6))
* **get_user_trips:** build response properly ([d61a302](https://github.com/salgode/salgode-backend/commit/d61a302))
* **get_user_vehicle:** fix response ([7ef315e](https://github.com/salgode/salgode-backend/commit/7ef315e))
* **get_user_vehicles:** new structure ([ff226ed](https://github.com/salgode/salgode-backend/commit/ff226ed))
* **login_user:** get images url and set body correctly ([75fd8ab](https://github.com/salgode/salgode-backend/commit/75fd8ab))
* **package:** changed name, added description ([501c15f](https://github.com/salgode/salgode-backend/commit/501c15f))
* **package-lock:** changed ([fbdb97b](https://github.com/salgode/salgode-backend/commit/fbdb97b))
* **request_reservation:** ambiguous parameter ([408f923](https://github.com/salgode/salgode-backend/commit/408f923))
* **request_reservation:** rename function ([8fc09bb](https://github.com/salgode/salgode-backend/commit/8fc09bb))
* **request_reservation:** response body ([01edbf6](https://github.com/salgode/salgode-backend/commit/01edbf6))
* **start_driver_trip:** parse response body as expected ([ed08ed1](https://github.com/salgode/salgode-backend/commit/ed08ed1))
* **update_user_vehicle:** parameter processing ([da43047](https://github.com/salgode/salgode-backend/commit/da43047))
* **user:** add car attribute ([b4a5c92](https://github.com/salgode/salgode-backend/commit/b4a5c92))


### Chore

* force yarn for consistency ([b5a2294](https://github.com/salgode/salgode-backend/commit/b5a2294))
* reinstall dependencies to clean unused ones ([4fdbc7b](https://github.com/salgode/salgode-backend/commit/4fdbc7b))
* remove logs ([ab396da](https://github.com/salgode/salgode-backend/commit/ab396da))
* **eslint:** airbnb-base ([020f34a](https://github.com/salgode/salgode-backend/commit/020f34a))


### Docs

* add web repo link ([4b149fd](https://github.com/salgode/salgode-backend/commit/4b149fd))


### Features

* **accept_reservation:** adapt to different endpoint ([67396b5](https://github.com/salgode/salgode-backend/commit/67396b5))
* **accept_reservation:** add accept reservation function ([d1589ac](https://github.com/salgode/salgode-backend/commit/d1589ac))
* **accept_reservation:** add updated at timestamp ([6a2a63c](https://github.com/salgode/salgode-backend/commit/6a2a63c))
* **authorizer:** added authorization ([292ccc9](https://github.com/salgode/salgode-backend/commit/292ccc9))
* **authorizer:** returning the user_id in the event context ([7e5ccbb](https://github.com/salgode/salgode-backend/commit/7e5ccbb))
* **cancel_reservation:** add cancel reservation function ([3d95a86](https://github.com/salgode/salgode-backend/commit/3d95a86))
* **check passenger:** add checkin and checkout functions ([b854d0d](https://github.com/salgode/salgode-backend/commit/b854d0d))
* **check passenger:** rename for lambda consistency ([fc92b6a](https://github.com/salgode/salgode-backend/commit/fc92b6a))
* **create_driver_trip:** add current point attribute ([11c449a](https://github.com/salgode/salgode-backend/commit/11c449a))
* **create_user:** add empty vehicle list ([2890d85](https://github.com/salgode/salgode-backend/commit/2890d85))
* **create_user:** remove timestamps from response ([0b8010b](https://github.com/salgode/salgode-backend/commit/0b8010b))
* **create_user_trip:** add create trip for user ([bcc9f68](https://github.com/salgode/salgode-backend/commit/bcc9f68))
* **create_user_trip:** delete old named file ([74dade2](https://github.com/salgode/salgode-backend/commit/74dade2))
* **create_user_vehicle:** add create vehicle function ([fa43bbc](https://github.com/salgode/salgode-backend/commit/fa43bbc))
* **current_trip:** add get current trip function ([1f03563](https://github.com/salgode/salgode-backend/commit/1f03563))
* **decline_reservation:** add decline reservation function ([e62bcd4](https://github.com/salgode/salgode-backend/commit/e62bcd4))
* **delete_user_vehicle:** Delete user vehicle ([5e4bbb8](https://github.com/salgode/salgode-backend/commit/5e4bbb8))
* **get_driver_grip:** add function ([c2145b4](https://github.com/salgode/salgode-backend/commit/c2145b4))
* **get_driver_reservations:** add get driver reservations function ([2b59e0d](https://github.com/salgode/salgode-backend/commit/2b59e0d))
* **get_driver_trip_manifest:** add function ([c6b93cf](https://github.com/salgode/salgode-backend/commit/c6b93cf))
* **get_driver_trips:** add first version function ([7f03b76](https://github.com/salgode/salgode-backend/commit/7f03b76))
* **get_driver_trips:** add get trips as driver ([4f46198](https://github.com/salgode/salgode-backend/commit/4f46198))
* **get_passenger_trips:** add get trips as passenger function ([0727c46](https://github.com/salgode/salgode-backend/commit/0727c46))
* **get_places:** add get places basic function ([e74e363](https://github.com/salgode/salgode-backend/commit/e74e363))
* **get_reservations:** add get reservations function ([3fc01cc](https://github.com/salgode/salgode-backend/commit/3fc01cc))
* **get_reservations:** add get reservations function ([7975070](https://github.com/salgode/salgode-backend/commit/7975070))
* **get_reservations:** rename file for consistency ([03118a5](https://github.com/salgode/salgode-backend/commit/03118a5))
* **get_trips:** added fields ([3f2adb4](https://github.com/salgode/salgode-backend/commit/3f2adb4))
* **get_user:** add bearer token and vehicles in response ([e75a974](https://github.com/salgode/salgode-backend/commit/e75a974))
* **get_user:** add get user function ([4ae4eee](https://github.com/salgode/salgode-backend/commit/4ae4eee))
* **get_user_self:** add get user self function ([7a3a475](https://github.com/salgode/salgode-backend/commit/7a3a475))
* **get_user_trips:** add get user trips function ([53bd454](https://github.com/salgode/salgode-backend/commit/53bd454))
* **get_user_vehicle:** add get user vehicle function ([8cb24b7](https://github.com/salgode/salgode-backend/commit/8cb24b7))
* **journey:** add start forward complete trip endpoint ([4da46bd](https://github.com/salgode/salgode-backend/commit/4da46bd))
* **layer:** add bearer to user id layer ([d86388e](https://github.com/salgode/salgode-backend/commit/d86388e))
* **request_reservation:** add check in and check out attribute ([a3cabf6](https://github.com/salgode/salgode-backend/commit/a3cabf6))
* **request_trip_reservation:** add reservation function ([d021ce4](https://github.com/salgode/salgode-backend/commit/d021ce4))
* **reservations:** add decline functions and timestamps ([a593402](https://github.com/salgode/salgode-backend/commit/a593402))
* **search_trips_by_place_intersection:** added trip search by place ([#16](https://github.com/salgode/salgode-backend/issues/16)) ([460ea57](https://github.com/salgode/salgode-backend/commit/460ea57))
* **slot:** add deploy script ([5d25c37](https://github.com/salgode/salgode-backend/commit/5d25c37))
* **status:** add deploy script ([e846866](https://github.com/salgode/salgode-backend/commit/e846866))
* **status:** add get current trips ([2892ca6](https://github.com/salgode/salgode-backend/commit/2892ca6))
* **trip:** add id on response ([045089e](https://github.com/salgode/salgode-backend/commit/045089e))
* **trip:** add spot to slot and fix av seats amount ([9615dd5](https://github.com/salgode/salgode-backend/commit/9615dd5))
* **trip:** add updated at param ([6e84b8b](https://github.com/salgode/salgode-backend/commit/6e84b8b))
* **update_user:** add event log and fix identities updating ([2fc23ae](https://github.com/salgode/salgode-backend/commit/2fc23ae))
* **update_user:** add update user function ([e1882db](https://github.com/salgode/salgode-backend/commit/e1882db))
* **update_user_vehicle:** Update user vehicle ([e5cbb14](https://github.com/salgode/salgode-backend/commit/e5cbb14))
* add bearer to user id function ([57f0ad5](https://github.com/salgode/salgode-backend/commit/57f0ad5))
* admit npm ([aa96993](https://github.com/salgode/salgode-backend/commit/aa96993))
* remove unused function ([be53ee9](https://github.com/salgode/salgode-backend/commit/be53ee9))
* **users:** add trips by user endpoint ([#13](https://github.com/salgode/salgode-backend/issues/13)) ([1013d2d](https://github.com/salgode/salgode-backend/commit/1013d2d))


### Refactor

* **get_passenger_reservation:** rename file for lambda function consistency ([43e80da](https://github.com/salgode/salgode-backend/commit/43e80da))
* **get_user_current_trip:** return empty object instead list ([0c24a65](https://github.com/salgode/salgode-backend/commit/0c24a65))
* apply linter to the code ([ace622b](https://github.com/salgode/salgode-backend/commit/ace622b))
* feat(update_user): response according to docs ([aae0dcd](https://github.com/salgode/salgode-backend/commit/aae0dcd))
* **create_trip:** move from user to driver resource ([829e773](https://github.com/salgode/salgode-backend/commit/829e773))
* **create_user:** add new consistency ([f09d5db](https://github.com/salgode/salgode-backend/commit/f09d5db))
* **get_passenger_trips:** make more efficient ([e4b02da](https://github.com/salgode/salgode-backend/commit/e4b02da))
* **get_trips:** changed attributes ([29cc34e](https://github.com/salgode/salgode-backend/commit/29cc34e))
* **get_user_vehicle:** improve readability ([34e7cd3](https://github.com/salgode/salgode-backend/commit/34e7cd3))
* **login_user:** add new consistency ([9e3085a](https://github.com/salgode/salgode-backend/commit/9e3085a))
* change file names and apply linter ([730223a](https://github.com/salgode/salgode-backend/commit/730223a))
* file name ([2953da7](https://github.com/salgode/salgode-backend/commit/2953da7))

### [0.0.2](https://github.com/Varuscl/salgode-api/compare/v0.0.1...v0.0.2) (2019-10-22)


### Bug Fixes

* dont retrieve password hash ([7d63fe6](https://github.com/Varuscl/salgode-api/commit/7d63fe6))
* get user ([ed8d204](https://github.com/Varuscl/salgode-api/commit/ed8d204))
* **slots:** accept slot ([210cfef](https://github.com/Varuscl/salgode-api/commit/210cfef))
* **slots:** create slot ([8df1711](https://github.com/Varuscl/salgode-api/commit/8df1711))
* **users:** fixed user create ([dc15027](https://github.com/Varuscl/salgode-api/commit/dc15027))
* **users:** fixed user login ([236e665](https://github.com/Varuscl/salgode-api/commit/236e665))
* deploy script ([a13b5c4](https://github.com/Varuscl/salgode-api/commit/a13b5c4))
* do not retrieve password ([71ad62b](https://github.com/Varuscl/salgode-api/commit/71ad62b))
* optional attribute ([a752fbd](https://github.com/Varuscl/salgode-api/commit/a752fbd))
* password mismatch validation ([3fab524](https://github.com/Varuscl/salgode-api/commit/3fab524))


### Chore

* add release script ([466dd89](https://github.com/Varuscl/salgode-api/commit/466dd89))
* remove logs and unuseful comments ([b025b39](https://github.com/Varuscl/salgode-api/commit/b025b39))
* **package:** added dependency ([aca2854](https://github.com/Varuscl/salgode-api/commit/aca2854))


### Docs

* add contributions ([a7e16eb](https://github.com/Varuscl/salgode-api/commit/a7e16eb))
* add contributor ([fc5737f](https://github.com/Varuscl/salgode-api/commit/fc5737f))
* add contributors ([5777cd6](https://github.com/Varuscl/salgode-api/commit/5777cd6))
* add contributors ([6681559](https://github.com/Varuscl/salgode-api/commit/6681559))


### Features

* add bcrypt ([965f67b](https://github.com/Varuscl/salgode-api/commit/965f67b))
* add delete user ([#3](https://github.com/Varuscl/salgode-api/issues/3)) ([961ebd2](https://github.com/Varuscl/salgode-api/commit/961ebd2))
* add deployment script ([d61a3b4](https://github.com/Varuscl/salgode-api/commit/d61a3b4))
* add deployment scripts ([fabb43f](https://github.com/Varuscl/salgode-api/commit/fabb43f))
* add get user ([885faa7](https://github.com/Varuscl/salgode-api/commit/885faa7))
* add login ([848924a](https://github.com/Varuscl/salgode-api/commit/848924a))
* add optional attributes ([75c3f05](https://github.com/Varuscl/salgode-api/commit/75c3f05))
* add read user ([47d490a](https://github.com/Varuscl/salgode-api/commit/47d490a))
* add token to user ([cb0b201](https://github.com/Varuscl/salgode-api/commit/cb0b201))
* add trip progress ([#11](https://github.com/Varuscl/salgode-api/issues/11)) ([6da4ce5](https://github.com/Varuscl/salgode-api/commit/6da4ce5))
* add trips endpoints ([#4](https://github.com/Varuscl/salgode-api/issues/4)) ([b951887](https://github.com/Varuscl/salgode-api/commit/b951887))
* add update and delete users ([b6d8bc6](https://github.com/Varuscl/salgode-api/commit/b6d8bc6))
* add update user ([adde35f](https://github.com/Varuscl/salgode-api/commit/adde35f))
* add update user ([#1](https://github.com/Varuscl/salgode-api/issues/1)) ([ae6e3c1](https://github.com/Varuscl/salgode-api/commit/ae6e3c1))
* hash password ([8b24e30](https://github.com/Varuscl/salgode-api/commit/8b24e30))
* modularize create and read user functions ([b8e5cbd](https://github.com/Varuscl/salgode-api/commit/b8e5cbd))
* retrieve only unique array element ([1fbf332](https://github.com/Varuscl/salgode-api/commit/1fbf332))
* upload image ([#9](https://github.com/Varuscl/salgode-api/issues/9)) ([1925bbd](https://github.com/Varuscl/salgode-api/commit/1925bbd))
* **slots:** accept trip slot ([7d41eff](https://github.com/Varuscl/salgode-api/commit/7d41eff))
* **slots:** create trip slot ([30fa8f1](https://github.com/Varuscl/salgode-api/commit/30fa8f1))
* **slots:** get slots ([a44c8a3](https://github.com/Varuscl/salgode-api/commit/a44c8a3))
* **spots:** get all the spots ([2d4ca2c](https://github.com/Varuscl/salgode-api/commit/2d4ca2c))
* **trips:** create trips ([18c468b](https://github.com/Varuscl/salgode-api/commit/18c468b))
* **trips:** get trips ([45bb9f0](https://github.com/Varuscl/salgode-api/commit/45bb9f0))
* add versioning config ([73b3f05](https://github.com/Varuscl/salgode-api/commit/73b3f05))
* move validation responses ([c92cc2d](https://github.com/Varuscl/salgode-api/commit/c92cc2d))
* separate lambda functions ([9b01ff5](https://github.com/Varuscl/salgode-api/commit/9b01ff5))
* **user:** add create operation ([3edddde](https://github.com/Varuscl/salgode-api/commit/3edddde))


### Refactor

* add solid update user ([e279a56](https://github.com/Varuscl/salgode-api/commit/e279a56))


### Style Improvements

* lint fix ([7f21c24](https://github.com/Varuscl/salgode-api/commit/7f21c24))
* lint fix ([fe46902](https://github.com/Varuscl/salgode-api/commit/fe46902))
* lint fix ([ab11e95](https://github.com/Varuscl/salgode-api/commit/ab11e95))

### 0.0.1 (2019-10-20)


### Chore

* initialize repository ([3a6fe37](https://github.com/Varuscl/salgode-api/commit/3a6fe37))


### Docs

* add license ([2c96ae1](https://github.com/Varuscl/salgode-api/commit/2c96ae1))
* add README ([120a993](https://github.com/Varuscl/salgode-api/commit/120a993))


### Features

* add aws lambda deploy script ([53295bf](https://github.com/Varuscl/salgode-api/commit/53295bf))
