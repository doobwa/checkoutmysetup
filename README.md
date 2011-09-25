API
=====

## User API

### GET /api/user/:id
information about the user with the provided id

Response:  200 OK

### PUT /api/user/:id
update a users information.

Parameters:

- title
- body

Response:  200 OK

### GET /api/user/:id/setups
array of setups belong to that user

Response:  200 OK

## Setup API

### GET /api/setups
array of setups for the logged in user. Might be changed to allow for
pagination and whatnot.

### GET /api/setups/:id

### POST /api/setups
Create a setup

Parameters:

- title
- url
- description

Response: 201 CREATED

### PUT /api/setups/:id
Edit a setup

Parameters:

- title
- url
- description

Response: 200 OK

### DELETE /api/setups/:id

Response: 200 OK

# Markers API

### GET /api/setups/:id/markers
Get the markers for the requested setup

Response: 200 OK

### POST /api/setups/:id/markers
Create a marker on a given setup

Parameters:

- text
- x: x coordinate relative to setup image 
- y: y coordinate relative to setup image

Response: 200 OK

### DELETE /api/setups/:id/markers/:marker
Remove :marker from setup :id.

Response: 200 OK

TODO
=====
- ~~staging heroku app and database~~
- ~~Page not found views and express errors~~
- Must be authenticated to be editing a setup
- Bitly url not working in staging app
- Use Facebook/Heroku integration example
- Make API more REST-like!
- compile js/css into one file
- Allow Markdown to be used to tags
- Hashtag/mention links
- Hashtag/mention pages

Useful commands
======

### Pushing a local branch to github
git push github mybranch

### Push to staging
git checkout staging

get merge other-branch

git push github 

git push heroku-staging staging:master

### Push to production

git checkout master

git merge staging

git push github

git push heroku
