API
=====

Most of this API has been hastily tested using the 'http-console'
project: https://github.com/cloudhead/http-console.  None of the
authentication-requiring methods are tested yet.

## User API

### GET /api/user/:userid
information about the user with the provided id

Response:  200 OK

### PUT /api/user/:userid
update a users information.

Parameters:

- title
- body

Response:  200 OK

### DELETE /api/user/:userid
Delete the currently logged in user's information.

Response: 501 NOT IMPLEMENTED

### GET /api/user/:id/setups
array of setups belong to that user

Response:  200 OK

## Setup API

### GET /api/setups
array of setups. (Might be changed to allow for
pagination and whatnot.)

### GET /api/setups/:setupid

### POST /api/setups
Create a setup for the logged in user.

Parameters:

- title
- url
- description

Response: 201 CREATED

### PUT /api/setups/:setupid
Edit a setup owned by the logged in user.

Parameters:

- title
- url
- description

Response: 200 OK

### DELETE /api/setups/:setupid
Delete a setup owned by the logged in user.

Response: 200 OK

# Markers API

### GET /api/setups/:setupid/markers
Get the markers for the requested setup

Response: 200 OK

### POST /api/setups/:setupid/markers
Create a marker on a given setup belonging to the logged in user

Parameters:

- text
- x: x coordinate relative to setup image 
- y: y coordinate relative to setup image

Response: 200 OK

### DELETE /api/setups/:setupid/markers/:markerid
Remove a marker from a setup belonging to the logged in user

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
