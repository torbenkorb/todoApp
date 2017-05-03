(function() {
    'use strict';

    if(withDevTools()) {
        var config = arguments[0] || {};
        config.features = { pause: true, export: true, test: true };
        config.type = 'redux';
        if (config.autoPause === undefined) config.autoPause = true;
        if (config.latency === undefined) config.latency = 500;
        var devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect(config);
    }

    var TodoListElement = document.getElementById('TodoList');
    var initialState = {
        todos: {},
        visibilityFilter: {
            history: 'SHOW_ALL',
            category: 'ALL'
        },
        nextTodoId: 1,
        lists: {
            1: 'Inbox'
        },
        nextListId: 2
    };

    function withDevTools() {
      return (window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__);
    }

    function validateAction(action) {
      if (!action || typeof action !== 'object' || Array.isArray(action)) {
        throw new Error('Action must be an object!');
      }
      if (action.type === 'undefined') {
        throw new Error('Action must have a type!');
      }
    }

    var createStore = function(reducer, state) {
      var subscribers = [];
      if(state === undefined) {
        state = initialState;
      }
      if(withDevTools()) {
        devTools.init(state);
      }
      return {
        dispatch: function dispatch(action) {
          validateAction(action);
          state = reducer(state, action);
          if(withDevTools()) {
            devTools.send(action, state);
          }
          console.log(state);
          subscribers.forEach(function (handler) {
            return handler();
          });
        },
        getState: function getState() {
          return state;
        },
        subscribe: function subscribe(handler) {
          subscribers.push(handler);
          return function() {
            var index = subscribers.indexOf(handler);
            if(index > 0) {
              subscribers.splice(index, 1);
            }
          };
        }
      }
    };

    var reducer = function(state, action) {
      switch(action.type) {
        case 'CREATE_TODO':
          var id = state.nextTodoId;
          var todo = {
            [id]: {
              id: id,
              name: action.name,
              completed: false,
              created: Date.now(),
              listID: action.listID || 1
            }
          };
          return Object.assign({}, state, {
            todos: Object.assign({}, state.todos, todo),
            nextTodoId: id + 1
          });
          break;

        case 'UPDATE_TODO':
          var todo = {
            [action.id]: Object.assign({}, state.todos[action.id], {
              name: action.name
            })
          }
          return Object.assign({}, state, {
            todos: Object.assign({}, state.todos, todo)
          });
          break;

        case 'REMOVE_TODO':
          var todos = state.todos;
          delete todos[action.id];
          return Object.assign({}, state, {
            todos: todos
          });
          break;

        case 'TOGGLE_TASK':
            var todo = {
                [action.id]: Object.assign({}, state.todos[action.id], {
                    completed: !state.todos[action.id].completed
                })
            };
            return Object.assign({}, state, {
                todos: Object.assign({}, state.todos, todo)
            });
            break;

        case 'CREATE_CATEGORY':
            var id = state.nextListId;
            console.log(id);
            var list = {
                [id]: action.name
            };
            return Object.assign({}, state, {
                lists: Object.assign({}, state.lists, list),
                nextListId: id + 1
            });
            break;

        case 'REMOVE_LIST':
            var lists = state.lists;
            delete lists[action.id];
            return Object.assign({}, state, {
                lists: lists
            });
            break;

        case 'SET_VISIBILITY_FILTER':
            var filter = {
                history: action.filter
            };
            return Object.assign({}, state, {
                visibilityFilter: Object.assign({}, state.visibilityFilter, filter)
            });
            break;

        case 'SET_CATEGORY':
            var filter = {
                category: action.id
            };
            return Object.assign({}, state, {
                visibilityFilter: Object.assign({}, state.visibilityFilter, filter)
            });

        default:
          return state;
          break;
      }
    };


    if (storageAvailable('localStorage')) {
        if(!localStorage.getItem('TodoApp')) {
            var newApp = createStore(reducer);
            newApp.dispatch({
              type: 'CREATE_TODO',
              name: 'Buy Milk'
            });
            newApp.dispatch({
                type:'CREATE_CATEGORY',
                name: 'Work'
            });
            newApp.dispatch({
              type: 'CREATE_TODO',
              name: 'Yearly Business Report',
              listID: 2
            });
            newApp.dispatch({
              type: 'TOGGLE_TASK',
              id: 1
            });
            newApp.getState();
        } else {
            var storedState = JSON.parse(localStorage.getItem('TodoApp'))
            var newApp = createStore(reducer, storedState);
        }
        newApp.subscribe(storeInLocalStorage);
        newApp.subscribe(renderApp);
    }
    else {
        // Too bad, no localStorage for us
        console.log('Too bad, no localStorage for us');
    }

    window.newApp = newApp;

    function renderTaskList() {
        var collection;
        var listTitle;
        var html = '';
        var visibilityClass = 'show-all';
        var state = newApp.getState();
        var todosAsArray = Object.values(state.todos);
        var total = todosAsArray.length;
        var activeItems = todosAsArray.filter(function(item) { return item.completed === false });
        var completeItems = todosAsArray.filter(function(item) { return item.completed === true });
        var stats = activeItems.length + ' items left';
        var filterContainer = document.getElementById('filter');

        switch(state.visibilityFilter.history) {
            case 'SHOW_COMPLETED':
                collection = completeItems;
                visibilityClass = 'show-completed';
                break;
            case 'SHOW_ACTIVE':
                collection = activeItems;
                visibilityClass = 'show-active';
                break;
            default:
                collection = todosAsArray;
                collection.sort(function(a,b) {
                    // if(a.completed != b.completed) {
                    //     return a.completed - b.completed;
                    // } else {
                        return a.id - b.id;
                    // }
                });
                break;
        }

        if(state.visibilityFilter.category !== 'ALL') {
            collection = collection.filter(function(item) { return item.listID === parseInt(state.visibilityFilter.category) });
        }

        if(state.visibilityFilter.category !== 'ALL') {
            listTitle = state.lists[state.visibilityFilter.category];
        } else {
            listTitle = 'All Tasks';
        }

        html += '<h2>' + listTitle + '</h2>';
        html += '<ul>';

        collection.forEach(function(item) {
            html += '<li id="item_' + item.id + '"';
            if(item.completed) {
              html += ' class="completed"';
            }
            html += '>';
            html += '<input class="checkbox" type="checkbox" id="ID_' + item.id + '"';
            if(item.completed) {
                html += ' checked';
            }
            html += '><label for="ID_' + item.id + '">';
            html += '<div class="checkbox-dummy"></div></label>';
            html += '<span class="content">';
            html += item.name;
            html += '</span>';


            html += '<span class="label">';
            html += state.lists[item.listID];
            html += '</span>';

            html += '<div class="remove-item">&times;</div>';
            html += '</li>';
        });
        html += '</ul>';
        TodoListElement.innerHTML = html;


        if(activeItems.length === 0) {
            if(completeItems.length > 0) {
                stats = 'Congratulations! All Tasks completed!';
            } else {
                stats = 'Start Your Productivity! Add some tasks now.';
            }
        }
        document.getElementById('items-left').innerHTML = stats;

        filterContainer.classList.remove('show-all', 'show-completed', 'show-active');
        filterContainer.classList.add(visibilityClass);



        var categories = '';
        for(var categoryID in state.lists) {
            var tasksInCategory = todosAsArray.filter(function(item) { return item.listID === parseInt(categoryID) && item.completed === false });
            var tasksCount = tasksInCategory.length;
            categories += '<li id="cat_' + categoryID + '"';
            if(categoryID === state.visibilityFilter.category) {
                categories += ' class="active"';
            }
            categories += '>'
            categories += state.lists[categoryID];
            categories += ' <span class="cat-count">' + tasksCount + '</span>';
            if(parseInt(categoryID) !== 1) {
                categories += '<span class="cat-remove">&times;</span>';
            }
            categories += '</li>';
        }
        categories += '<li id="cat_ALL"';
        if(state.visibilityFilter.category === 'ALL') {
            categories += ' class="active"';
        }
        categories += '>All Tasks <span class="cat-count">' + activeItems.length + '</span></li>';
        document.getElementById('categories').innerHTML = categories;
    }

    function renderApp() {
        renderTaskList();
    }

    function storageAvailable(type) {
        try {
            var storage = window[type],
                x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch(e) {
            return false;
        }
    }

    function storeInLocalStorage() {
      var state = newApp.getState();
      localStorage.setItem('TodoApp', JSON.stringify(state));
    }

    document.getElementById('get-value').addEventListener('submit', function(e) {
        e.preventDefault();
        var inputField = document.getElementById('input-field');
        var userInput = inputField.value;
        var state = newApp.getState();
        var category = state.visibilityFilter.category;
        category = category === 'ALL' ? 1 : parseInt(category);
        inputField.value = '';
        if(userInput) {
            newApp.dispatch({
              type: 'CREATE_TODO',
              name: userInput,
              listID: category
            });
            // renderTaskList();
        }
    });

    TodoListElement.addEventListener('click', function(e) {
        if(e.target.className == 'remove-item') {
            var id = e.target.parentElement.id.replace('item_', '');
            newApp.dispatch({
              type: 'REMOVE_TODO',
              id: id
            });
            // renderTaskList();
        }
        if(e.target.className == 'checkbox-dummy') {
            var id = e.target.parentElement.htmlFor.replace('ID_', '');
            newApp.dispatch({
              type: 'TOGGLE_TASK',
              id: id
            });
            // renderTaskList();
        }
        if(e.target.className == 'content') {
            e.preventDefault();
            var form = document.createElement('form');
            var inputField = document.createElement('input');
            inputField.setAttribute('type', 'text');
            inputField.setAttribute('value', e.target.innerText);
            form.append(inputField);
            e.target.parentNode.replaceChild(form, e.target);
            inputField.focus();
        }
    });

    TodoListElement.addEventListener('submit', function(e) {
        e.preventDefault();
        var id = e.target.parentNode.id.replace('item_', '');
        var value = e.target.childNodes[0].value;
        newApp.dispatch({
          type: 'UPDATE_TODO',
          id: id,
          name: value
        });
        // renderTaskList();
    });

    document.getElementById('filter').addEventListener('click', function(e) {
        switch(e.target.id) {
            case 'show-all':
                newApp.dispatch({
                  type: 'SET_VISIBILITY_FILTER',
                  filter: 'SHOW_ALL'
                });
                break;
            case 'show-active':
                newApp.dispatch({
                  type: 'SET_VISIBILITY_FILTER',
                  filter: 'SHOW_ACTIVE'
                });
                break;
            case 'show-completed':
                newApp.dispatch({
                  type: 'SET_VISIBILITY_FILTER',
                  filter: 'SHOW_COMPLETED'
                });
                break;
        }
        // renderTaskList();
    });


    document.getElementById('drawer-open').addEventListener('click', function() {
        var body = document.getElementsByTagName('body')[0];
        body.classList.toggle('open-drawer');
    });

    document.getElementById('print').addEventListener('click', function() {
        window.print();
    });

    document.getElementById('categories').addEventListener('click', function(e) {
        if(e.target.tagName === 'LI') {
            var id = e.target.id.replace('cat_', '');
            newApp.dispatch({
                type: 'SET_CATEGORY',
                id: id
            });
            // renderTaskList();
        }
        if(e.target.className === 'cat-remove') {
            var id = parseInt(e.target.parentNode.id.replace('cat_', ''));
            newApp.dispatch({
                type: 'REMOVE_LIST',
                id: id
            });
            // renderTaskList();
        }
    });

    document.getElementById('add-list').addEventListener('click', function(e) {
        e.preventDefault();
        var category = prompt('List Name?');
        if(category) {
            newApp.dispatch({
                type: 'CREATE_CATEGORY',
                name: category
            });
            // renderTaskList();
        }
    });

    renderTaskList();

})();
