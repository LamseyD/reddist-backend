# What is an ORM/Micro ORM
Object Relational Mapper assists with mapping data between two systems (e.g server and db)
https://stackoverflow.com/questions/494816/using-an-orm-or-plain-sql


# Session
req.session.userId = user.id;

{userId: 1} -> send that to redis - save session to redis

redis is a key value store/db

1
key                 -> object
sess:qwoeiuowqjoqjw -> { userId: 1 }

2 Session middleware
express-session will set a cookie on my browser qwoieu9012798quw9euoe1i2uo (signed version of key (encrypt it))

3
when user makes a request
qwoieu9012798quw9euoe1i2uo -> sent to the server

4
server decrypts the cookie
qwoieu9012798quw9euoe1i2uo -> sess:qwoeiuowqjoqjw

5
server makes a request to redis
sess:qwoeiuowqjoqjw -> { userId: 1 }

req.session = { userId: 1 }

# Future features

Replace login so it only supports username