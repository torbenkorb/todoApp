(function() {

  'use strict';

  console.log('App is live!');

  // ===========================================
  // APP CONSTRUCTOR
  // ===========================================

  function TodoApp() {
    this.all = [];
    this.addListEventIsSet = false;
  }

  TodoApp.prototype.addList = function(name) {
    this.all.push(name);
  };

  // TODO: set param to ID instead of name to prevent misfunction with lists of same name
  TodoApp.prototype.removeList = function(name) {
    for (var i=0;i<this.all.length;i++) {
      if(this.all[i].name == name) {
        this.all.splice(i, 1);
      }
    }
    this.renderApp();
  };

  TodoApp.prototype.addItem = function(item, list) {
    this.all[list].items.push(new TodoItem(item));
  };

  TodoApp.prototype.completeTask = function(id) {
    // TODO: Make this function dynamic
    for(var i=0;i<this.all.length;i++) {
      for (var j=0;j<this.all[i].items.length;j++) {
        if(this.all[i].items[j].ID === id) {
          this.all[i].items[j].isCompleted = true;
        }
      }
    }
  };

  TodoApp.prototype.listEventListener = function(index, element) {
    var catchThis = this;
    element[index].addEventListener('click', function() {
      catchThis.removeList(this.innerText);
    });
  };

  TodoApp.prototype.listController = function() {
    var catchThis = this;
    var addListButton = document.getElementById('add-list');
    if(this.addListEventIsSet === false) {
      addListButton.addEventListener('click', function(e) {
        e.preventDefault();
        var listInput = prompt("What's the name of your list?");
        if(listInput) {
          var newList = new TodoList(listInput);
          catchThis.addList(newList);
          catchThis.renderApp();
        }
      });
      this.addListEventIsSet = true;
    }
    var categoriesListItem = document.getElementsByClassName('todo-list-category-name');
    for(var i=0;i<categoriesListItem.length;i++) {
      catchThis.listEventListener(i, categoriesListItem);
    }
  };

  TodoApp.prototype.addButtonEventListener = function(counter, buttons) {
      var catchThis = this;
      buttons[counter].addEventListener('click', function(e) {
        e.preventDefault(e);
        var getItem = prompt('What task do you like to accomplish?');
        if(getItem) {
          catchThis.addItem(getItem, counter);
          catchThis.renderApp();
        }
      });
  };

  TodoApp.prototype.completeItemEventListener = function(index, elements) {
    elements[index].addEventListener('click', function() {
      this.classList.toggle('is-completed');
    });
  };

  TodoApp.prototype.itemController = function() {
    var buttons = document.getElementsByClassName('add-item');
    var catchThis = this;
    for (var i=0;i<buttons.length;i++) {
      catchThis.addButtonEventListener(i, buttons);
    }
    var items = document.getElementsByClassName('todo-item');
    for(var j=0;j<items.length;j++) {
      catchThis.completeItemEventListener(j, items);
    }
  };

  TodoApp.prototype.renderApp = function() {
    this.renderCategories();
    this.renderLists();
    console.log(this);
  };

  TodoApp.prototype.renderCategories = function() {
    var catchThis = this;
    var categorieElement = document.getElementById('categories');
    var allItems = 0;
    categorieElement.innerHTML = "";
    for (var i=0;i<this.all.length;i++) {
      var listElement = '<li class="todo-list-category"><span class="todo-list-category-name">' + this.all[i].name + '</span>';
      listElement += ' <span class="category-count">' + this.all[i].items.length + '</span> <span class="remove-category">x</span></li>';
      categorieElement.innerHTML += listElement;
      allItems += this.all[i].items.length;
    }
    categorieElement.innerHTML += '<li class="is-active">All Items <span class="category-count">' + allItems + '</span></li>';
    this.listController();
  };

  TodoApp.prototype.renderLists = function(listname) {
    var listBlock = document.getElementById('todoapp');
    listBlock.innerHTML = "";
    for (var i=0;i<this.all.length;i++) {
      var list = '<h2>' + this.all[i].name + '</h2>';
      list += '<ul class="todo-list">';
      for (var j=0;j<this.all[i].items.length;j++) {
        list += '<li class="todo-item';
        if(this.all[i].items[j].isCompleted === true) {
          list += ' is-completed';
        } 
        list += '"">' + this.all[i].items[j].name + '</li>';
      }
      list += '</ul>';
      list += '<a class="add-item" href="#">+ Add Item</a>';
      listBlock.innerHTML += list;
    }

    this.itemController();
  };




  // ===========================================
  // TODO LIST CONSTRUCTOR
  // ===========================================

  function TodoList(name) {
    this.name = name;
    this.items = [];
  }

  TodoList.prototype.addItem = function(name) {
    this.items.push(new TodoItem(name));
  };

  // ===========================================
  // TODO ITEM CONSTRUCTOR
  // ===========================================

  var IdCounter = 0;

  function TodoItem(name) {
    this.name = name;
    this.isCompleted = false;
    this.ID = IdCounter;
    IdCounter++;
  }






  // ===========================================
  // APP RUNTIME
  // ===========================================

  var groceries = new TodoList('Groceries');
  groceries.addItem('Milk');
  groceries.addItem('Eggs');


  var travel = new TodoList('Travel Destinations');
  travel.addItem('Brazil');
  travel.addItem('New York');


  var home = new TodoList('Home ToDos');
  home.addItem('Clean Kitchen');

  var work = new TodoList('Work Tasks');
  work.addItem('Finish yearly report');
  work.addItem('Contact Marketing Team');

  // var counter = 0;
  // while(counter<55) {
  //   travel.addItem('Destination');
  //   counter++;
  // }


  var app = new TodoApp();
  app.addList(work);
  app.addList(home);
  app.addList(groceries);
  app.addList(travel);

  app.renderApp();




})();
