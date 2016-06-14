# Abstract Model

Abstract Asynchronous Data Model API

## Rationale

In REST APIs, I wanted to load nested API objects in a more organized fashion. The primary complexity of doing this was making asynchronous database calls in a synchronous syntax. Using the syntactic sugar of `GeneratorFunction`s, this module provides a simple way to asynchronously load properties onto a JavaScript model class instance. 

The object below exemplifies the type of nested object I'm referring to.

```javascript
var user = {
  id: 1,
  name: 'My Name',
  image: {
    path: '/user/1.png',
    url: 'https://example.com/user/1.png'
  }
};
```

## Usage

This is an SQL-ish example of how the model works. It may be adapted to many other types of asynchronous methods.

```JavaScript
"use strict";

const co = require('co');
const AbstractModel = require('AbstractModel').AbstractModel;
const db = require('./db');

class ImageModel extends AbstractModel {
  // by default, simply calling `ImageModel.fromRow(row)`, where 
  // row is an instance of Array or Object, will create 
  // an instance of `ImageModel` for each of the given object(s) 
  // with all the original properties attached.
  
  /**
   * @return Promise
   */
  static findByUserId(userId) {
    return db.query('select * from images where user_id = ? limit 1', [userId]);
  }
}


const AbstractModel = require('AbstractModel').AbstractModel;
const ImageModel = require('./ImageModel');

class UserModel extends AbstractModel {
  *load(row, opts) {
    // this will ensure that the row object gets wrapped
  	 yield super.load(row, opts);
  	 
  	 // this.id is an (example) Integer user id that got applied
  	 // in the super.load()
  	 this.image = yield ImageModel.findByUserId(this.id);
  	 
  	 return this;
  }
}


co(function *() {
  let row = yield db.query('select * from users where user_id = ? limit 1', [userId]);
  let user = yield UserModel.fromRow(row);
  console.log(user);
  
  let rows = yield db.query('select * from users limit 10');
  let users = yield UserModel.fromRow(rows);
  console.log(users);
});
```

## More Examples
See [SandJS MySQL Model](https://github.com/SandJS/mysql/blob/master/lib/Model.js) for a full example.