(function() {
    'use strict';

    if(withDevTools) {
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
        visibilityFilter: 'SHOW_ALL',
        nextTodoId: 1
    };

    function withDevTools() {
      return (window !== 'undefined' && window.devToolsExtension);
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
      if(state === undefined) {
        state = initialState;
      }
      if(withDevTools) {
        devTools.init(state);
      }
      return {
        dispatch: function(action) {
          validateAction(action);
          state = reducer(state, action);
          if(withDevTools) {
            devTools.send(action, state);
          }
          console.log(state);
        },
        getState: function() {
          return state;
        },
        subscribe: function() {
          localStorage.setItem('TodoApp', JSON.stringify(state))
        }
      }
    };

    var reducer = function(state, action) {
      switch(action.type) {
        case 'CREATE_TODO':
          var id = state.nextTodoId;
          var todo = {
            [id]: {
              id: state.nextTodoId,
              name: action.name,
              completed: false,
              created: Date.now()
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

        case 'SET_VISIBILITY_FILTER':
          return Object.assign({}, state, {
            visibilityFilter: action.filter
          });
          break;

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
              type: 'CREATE_TODO',
              name: 'Walk the Dog'
            });
            newApp.dispatch({
              type: 'TOGGLE_TASK',
              id: 1
            });
            newApp.getState();
            newApp.subscribe();
        } else {
            var storedState = JSON.parse(localStorage.getItem('TodoApp'))
            var newApp = createStore(reducer, storedState);
        }
    }
    else {
        // Too bad, no localStorage for us
        console.log('Too bad, no localStorage for us');
    }

    window.newApp = newApp;

    function renderTaskList() {
        var collection;
        var html = '<ul>';
        var visibilityClass = 'show-all';
        var state = newApp.getState();
        var todosAsArray = Object.values(state.todos);
        var total = todosAsArray.length;
        var activeItems = todosAsArray.filter(function(item) { return item.completed === false });
        var completeItems = todosAsArray.filter(function(item) { return item.completed === true });
        var stats = activeItems.length + ' items left';
        var filterContainer = document.getElementById('filter');

        newApp.subscribe();

        switch(state.visibilityFilter) {
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
                    //}
                });
                break;
        }

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






    document.getElementById('get-value').addEventListener('submit', function(e) {
        e.preventDefault();
        var inputField = document.getElementById('input-field');
        var userInput = inputField.value;
        inputField.value = '';
        if(userInput) {
            newApp.dispatch({
              type: 'CREATE_TODO',
              name: userInput
            });
            renderTaskList();
        }
    });

    TodoListElement.addEventListener('click', function(e) {
        if(e.target.className == 'remove-item') {
            var id = e.target.parentElement.id.replace('item_', '');
            newApp.dispatch({
              type: 'REMOVE_TODO',
              id: id
            });
            renderTaskList();
        }
        if(e.target.className == 'checkbox-dummy') {
            var id = e.target.parentElement.htmlFor.replace('ID_', '');
            newApp.dispatch({
              type: 'TOGGLE_TASK',
              id: id
            });
            renderTaskList();
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
        renderTaskList();
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
        renderTaskList();
    });

    renderTaskList();

})();
