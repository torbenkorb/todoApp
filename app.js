(function() {
    'use strict';


    // Todo:
    // - Rename newApp to Store
    // - Rename model todos => tasks and lists => tasklists
    // - Render view by collection, keep not in state


    var TodoListElement = document.getElementById('TodoList');
    var initialState = {
        todos: {
            byID: {},
            allIDs: [],
            nextTodoId: 1,
        },
        visibilityFilter: {
            history: 'SHOW_ALL',
            category: 0
        },
        lists: {
            byID: {},
            allIDs: [],
            nextListId: 1
        },
        notifications: [],
        activities: []
    };

    if(withDevTools()) {
        var config = arguments[0] || {};
        config.features = { pause: true, export: true, test: true };
        config.type = 'redux';
        if (config.autoPause === undefined) config.autoPause = true;
        if (config.latency === undefined) config.latency = 500;
        var devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect(config);
    }

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

    function updateObject(oldObject, newValues) {
        return Object.assign({}, oldObject, newValues);
    }

    function updateItemInArray(array, itemId, updateItemCallback) {
        const updatedItems = array.map(item => {
            if(item.id !== itemId) {
                // Since we only want to update one item, preserve all others as they are now
                return item;
            }

            // Use the provided callback to create an updated item
            const updatedItem = updateItemCallback(item);
            return updatedItem;
        });

        return updatedItems;
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

    function addTodo(state, action) {
        var id = state.todos.nextTodoId;
        var listID = action.listID || 1;
        var todo = {
          [id]: {
            id: id,
            name: action.name,
            completed: false,
            created: Date.now(),
            listID: listID
          }
        };
        return updateObject(state, {
          todos: updateObject(state.todos, {
            byID: updateObject(state.todos.byID, todo),
            allIDs: state.todos.allIDs.concat(id),
            nextTodoId: id + 1
          }),
          lists: updateObject(state.lists, {
            byID: updateObject(state.lists.byID, {
                [listID]: updateObject(state.lists.byID[listID], {
                    todos: state.lists.byID[listID].todos.concat(id)
                })
            })
          }),
          activities: state.activities.concat('You created a new task: ' + action.name)
        });
    }

    function updateTodo(state, action) {
        var todo = {
          [action.id]: updateObject(state.todos.byID[action.id], { name: action.name })
        };
        return updateObject(state, {
            todos: updateObject(state.todos, {
                byID: updateObject(state.todos.byID, todo)
            }),
            activities: state.activities.concat('You changed the task name from ' + state.todos.byID[action.id].name + ' to ' + action.name)
        });
    }

    function removeTodo(state, action) {
        var todos = Object.assign({}, state.todos.byID);
        var todoIDs = Object.assign([], state.todos.allIDs);
        var listID = todos[action.id].listID;
        delete todos[action.id];
        return updateObject(state, {
            todos: updateObject(state.todos, {
                byID: todos,
                allIDs: todoIDs.filter(function(item) { return item != action.id })
            }),
            lists: updateObject(state.lists, {
                byID: updateObject(state.lists.byID, {
                    [listID]: updateObject(state.lists.byID[listID], {
                        todos: state.lists.byID[listID].todos.filter(function(item) { return item != action.id })
                    })
                })
            }),
            activities: state.activities.concat('You removed a task: ' + state.todos.byID[action.id].name)
        });
    }

    function toggleTask(state, action) {
        var todo = {
            [action.id]: Object.assign({}, state.todos.byID[action.id], {
                completed: !state.todos.byID[action.id].completed
            })
        };
        var todos = updateObject(state.todos, {
            byID: updateObject(state.todos.byID, todo)
        });
        var message = 'You  ';
        if(!state.todos.byID[action.id].completed) {
            message += 'completed a task: ';
        } else {
            message += 'marked a task as incompleted: ';
        }
        message += state.todos.byID[action.id].name;
        return updateObject(state, {
            todos: todos,
            activities: state.activities.concat(message)
        });
    }

    function createList(state, action) {
        var id = state.lists.nextListId;
        var list = {
            [id]: {
                name: action.name,
                id: id,
                todos: []
            }
        };
        return updateObject(state, {
            lists: updateObject(state.lists, {
                byID: updateObject(state.lists.byID, list),
                allIDs: state.lists.allIDs.concat(id),
                nextListId: id + 1
            }),
            activities: state.activities.concat('You created a new list: ' + action.name)
        });
    }

    function removeList(state, action) {
        var lists = Object.assign({}, state.lists.byID);
        var todos = Object.assign({}, state.todos.byID);
        var listIDs = Object.assign([], state.lists.allIDs);
        var todoIDs = Object.assign([], state.todos.allIDs);
        delete lists[action.id];
        for (var key in todos) {
            if(todos[key].listID === action.id) {
                delete todos[key];
            }
        }
        return updateObject(state, {
            lists: updateObject(state.lists, {
                byID: lists,
                allIDs: listIDs.filter(function(listID) { return listID != action.id })
            }),
            todos: updateObject(state.todos, {
                byID: todos,
                allIDs: todoIDs.filter(function(todoID) { return state.todos.byID[todoID].listID != action.id})
            }),
            activities: state.activities.concat('You removed a list: ' + state.lists.byID[action.id].name)
        });
    }

    function setVisibilityFilter(state, action) {
        return updateObject(state, {
            visibilityFilter: updateObject(state.visibilityFilter, {
                history: action.filter
            })
        });
    }

    function setCategory(state, action) {
        return updateObject(state, {
            visibilityFilter: updateObject(state.visibilityFilter, {
                category: action.id
            })
        });
    }

    function addNotification(state, action) {
        return updateObject(state, {
            notifications: state.notifications.concat(action.message)
        });
    }

    var reducer = function(state, action) {
      switch(action.type) {
        case 'CREATE_TODO':
            return addTodo(state, action);

        case 'UPDATE_TODO':
            return updateTodo(state, action);

        case 'REMOVE_TODO':
            return removeTodo(state, action);

        case 'TOGGLE_TASK':
            return toggleTask(state, action);

        case 'CREATE_LIST':
            return createList(state, action);

        case 'REMOVE_LIST':
            return removeList(state, action);

        case 'SET_VISIBILITY_FILTER':
            return setVisibilityFilter(state, action);

        case 'SET_CATEGORY':
            return setCategory(state, action);

        case 'ADD_NOTIFICATION':
            return addNotification(state, action);

        default:
          return state;
      }
    };


    if (storageAvailable('localStorage')) {
        if(!localStorage.getItem('TodoApp')) {
            var newApp = createStore(reducer);
            newApp.dispatch({
                type:'CREATE_LIST',
                name: 'Inbox'
            });
            newApp.dispatch({
              type: 'CREATE_TODO',
              name: 'Buy Milk'
            });
            newApp.dispatch({
                type:'CREATE_LIST',
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

    function renderTaskList() {
        var collection;
        var listTitle;
        var html = '';
        var visibilityClass = 'show-all';
        var filterLabel = 'All Tasks';
        var state = newApp.getState();
        var todosAsArray = Object.values(state.todos.byID);
        var total = todosAsArray.length;
        var activeItems = todosAsArray.filter(function(item) { return item.completed === false });
        var completeItems = todosAsArray.filter(function(item) { return item.completed === true });

        switch(state.visibilityFilter.history) {
            case 'SHOW_COMPLETED':
                collection = completeItems;
                visibilityClass = 'show-completed';
                filterLabel = 'Completed Tasks';
                break;
            case 'SHOW_ACTIVE':
                collection = activeItems;
                visibilityClass = 'show-active';
                filterLabel = 'Active Tasks';
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

        listTitle = 'All Tasks';

        if(state.visibilityFilter.category !== 0) {
            collection = collection.filter(function(item) { return item.listID === state.visibilityFilter.category });
            listTitle = state.lists.byID[state.visibilityFilter.category].name;
        }

        html += '<ul>';

        collection.forEach(function(item) {
            html += '<li draggable="true" id="item_' + item.id + '"';
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
            html += state.lists.byID[item.listID].name;
            html += '</span>';

            html += '<div class="remove-item">&times;</div>';
            html += '</li>';
        });
        html += '</ul>';
        TodoListElement.innerHTML = html;

        var visibleList = state.visibilityFilter.category !== 0 ? state.visibilityFilter.category : 0;

        var activeCollection = visibleList !== 0 ? state.lists.byID[visibleList].todos : state.todos.allIDs;

        activeCollection = activeCollection.filter(function(id) {
            return state.todos.byID[id].completed !== true;
        });

        document.getElementById('tools-headline').innerHTML = listTitle;
        document.getElementById('active-count').innerHTML = activeCollection.length;

        renderListsInDrawer();

        if(state.notifications.length > 0) {
            renderNotifications();
        }


        document.querySelector('#filter-dropdown ul').classList.remove('show-all', 'show-completed', 'show-active');
        document.querySelector('#filter-dropdown ul').classList.add(visibilityClass);
        document.querySelector('#list-filter-label').innerText = filterLabel;

    }

    function renderActivities() {
        var html = '<ul>';
        var state = newApp.getState();
        var collection = Object.assign([], state.activities);

        collection.reverse()

        collection.forEach(function(item) {
            html += '<li>' + item + '</li>';
        });

        TodoListElement.innerHTML = html;
    }

    function renderNotifications() {
        var state = newApp.getState();
        document.querySelector('#notification-container .badge').innerHTML = '<span>' + state.notifications.length + '</span>';

        var notificationHTML = '<ul>';
        state.notifications.forEach(function(message) {
            notificationHTML += '<li>' + message + '</li>';
        });
        notificationHTML += '</ul>';
        document.querySelector('.dropdown').innerHTML = notificationHTML;

    }

    function renderListsInDrawer() {
        var state = newApp.getState();
        var listsHTML = '';
        var activeItems = state.todos.allIDs.filter(function(todo) {
            return state.todos.byID[todo].completed === false;
        });

        var listCollection = Object.assign([], state.lists.allIDs);

        listCollection.forEach(function(listID) {

            var listActive = state.lists.byID[listID].todos.filter(function(todo) {
                return state.todos.byID[todo].completed === false;
            });

            listsHTML += '<li id="cat_' + listID + '"';
            if(listID === state.visibilityFilter.category) {
                listsHTML += ' class="active"';
            }
            listsHTML += '>';
            if(listID === 1) {
                listsHTML += '<i class="material-icons">inbox</i>';
            }
            listsHTML += state.lists.byID[listID].name;
            listsHTML += ' <span class="cat-count">' + listActive.length + '</span>';
            if(listID !== 1) {
                listsHTML += '<span class="cat-remove">&times;</span>';
            }
            listsHTML += '</li>';
        });

        listsHTML += '<li id="cat_0"';
        if(state.visibilityFilter.category === 0) {
            listsHTML += ' class="active"';
        }
        listsHTML += '>All Tasks <span class="cat-count">' + activeItems.length + '</span></li>';
        document.getElementById('categories').innerHTML = listsHTML;
    }


    function renderApp() {
        var state = newApp.getState();
        renderTaskList();
    }

    function toggleDrawer() {
        var body = document.getElementsByTagName('body')[0];
        body.classList.toggle('open-drawer');
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
        category = category === 0 ? 1 : category;
        inputField.value = '';
        if(userInput) {
            newApp.dispatch({
              type: 'CREATE_TODO',
              name: userInput,
              listID: category
            });
        }
    });

    TodoListElement.addEventListener('click', function(e) {
        if(e.target.className == 'remove-item') {
            var id = e.target.parentElement.id.replace('item_', '');
            if(confirm('You really want to delete this todo item?')) {
                newApp.dispatch({
                  type: 'REMOVE_TODO',
                  id: id
                });
            }
        }
        if(e.target.className == 'checkbox-dummy') {
            var id = e.target.parentElement.htmlFor.replace('ID_', '');
            newApp.dispatch({
              type: 'TOGGLE_TASK',
              id: id
            });
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
    });

    document.getElementById('filter-dropdown').addEventListener('click', function(e) {
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
    });

    document.getElementById('drawer-open').addEventListener('click', function() {
        toggleDrawer();
    });

    document.getElementById('drawer-close').addEventListener('click', function() {
        toggleDrawer();
    });

    document.getElementById('print').addEventListener('click', function() {
        window.print();
    });

    document.getElementById('categories').addEventListener('click', function(e) {
        var id = -1;
        if(e.target.tagName === 'LI') {
            id = parseInt(e.target.id.replace('cat_', ''));
        } else if(e.target.parentNode.tagName === 'LI') {
            id = parseInt(e.target.parentNode.id.replace('cat_', ''));
        }
        if(id !== -1) {
            newApp.dispatch({
                type: 'SET_CATEGORY',
                id: id
            });
        }
        console.dir(e.target);
        if(e.target.className === 'cat-remove') {
            var id = parseInt(e.target.parentNode.id.replace('cat_', ''));
            var state = newApp.getState();
            if(confirm('You really want to delete the list "' + state.lists.byID[id].name + '"?')) {
                if(state.visibilityFilter.category === id) {
                    newApp.dispatch({
                        type: 'SET_CATEGORY',
                        id: 1
                    });
                }
                newApp.dispatch({
                    type: 'REMOVE_LIST',
                    id: id
                });

            }
        }
    });

    document.getElementById('add-list').addEventListener('click', function(e) {
        e.preventDefault();
        var category = prompt('List Name?');
        if(category) {
            newApp.dispatch({
                type: 'CREATE_LIST',
                name: category
            });
        }
    });

    document.getElementById('show-activities').addEventListener('click', function(e) {
        renderActivities();
    })

    document.getElementById('notification-container').addEventListener('click', function(e) {
        document.querySelector('#notification-container .dropdown').classList.toggle('show');
    });

    document.getElementById('list-filter').addEventListener('click', function(e) {
        document.querySelector('#list-filter .dropdown').classList.toggle('show');
    });

    renderTaskList();

})();
