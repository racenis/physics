// InteractiveViz.js - smol library for interactive visualizations uwu
// usage: new InteractiveViz({ ...config... }) ;33

class InteractiveViz {
  constructor(config) {
    // store config >_<
    this.config = config;
    this.containerId = config.containerId;
    this.title = config.title || "Visualization";
    this.canvasWidth = config.canvasWidth || 400;
    this.canvasHeight = config.canvasHeight || 300;
    
    // state tracking uwu
    this.state = {
      inputs: {},
      icons: {},
      width: this.canvasWidth,  // canvas dimensions for ez access! :3
      height: this.canvasHeight,
      viz: this  // reference to the viz class itself! >_<
    };
    
    // animation stuff :3
    this.animationId = null;
    this.lastTime = 0;
    this.isPaused = false;
    this.draggedIcon = null;
    
    // init everything! >_<
    this.initInputs();
    this.initIcons();
    this.buildUI();
    this.setupEventListeners();
    
    // call onInit if exists uwu
    if (this.config.onInit) {
      this.config.onInit(this.state);
    }
    
    // start the render loop! :333
    this.startAnimation();
  }
  
  // setup initial input values >_<
  initInputs() {
    var inputs = this.config.inputs || [];
    
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      
      if (input.type === 'slider') {
        this.state.inputs[input.id] = input.initial;
      } else if (input.type === 'radio') {
        this.state.inputs[input.id] = input.options[0][0]; // first option's id uwu
      }
      // buttons don't need state :3
    }
  }
  
  // setup initial icon positions uwu
  initIcons() {
    var icons = this.config.icons || [];
    var self = this;
    
    for (var i = 0; i < icons.length; i++) {
      var icon = icons[i];
      this.state.icons[icon.id] = {
        x: icon.x,
        y: icon.y,
        pos: { x: icon.x, y: icon.y },  // dict version for geometry functions! :333
        emoji: icon.emoji,
        label: icon.label,
        hidden: false,  // for setHidden method >_<
        scale: 1.0,     // for setScale method uwu
        rotation: 0,    // for setRotation method (in radians!) :3
        
        // method to update icon position! :333
        setPosition: function(iconId) {
          return function(x, y) {
            self.state.icons[iconId].x = x;
            self.state.icons[iconId].y = y;
            self.state.icons[iconId].pos.x = x;  // update dict too! uwu
            self.state.icons[iconId].pos.y = y;
            var elem = document.getElementById(self.containerId + '-icon-' + iconId);
            if (elem) {
              elem.style.left = x + 'px';
              elem.style.top = y + 'px';
            }
          };
        }(icon.id),
        
        // method to change emoji! :3
        setEmoji: function(iconId) {
          return function(newEmoji) {
            self.state.icons[iconId].emoji = newEmoji;
            var elem = document.getElementById(self.containerId + '-icon-' + iconId);
            if (elem) {
              var emojiDiv = elem.querySelector('div:first-child');
              if (emojiDiv) emojiDiv.textContent = newEmoji;
            }
          };
        }(icon.id),
        
        // method to change label! >_<
        setLabel: function(iconId) {
          return function(newLabel) {
            self.state.icons[iconId].label = newLabel;
            var elem = document.getElementById(self.containerId + '-icon-' + iconId);
            if (elem) {
              var labelDiv = elem.querySelector('div:last-child');
              if (labelDiv && labelDiv !== elem.querySelector('div:first-child')) {
                labelDiv.textContent = newLabel;
              } else if (newLabel) {
                // add label if didn't exist before uwu
                var newLabelDiv = document.createElement('div');
                newLabelDiv.style.cssText = 'font-size: 10px; margin-top: -4px;';
                newLabelDiv.textContent = newLabel;
                elem.appendChild(newLabelDiv);
              }
            }
          };
        }(icon.id),
        
        // method to hide/show icon! :333
        setHidden: function(iconId) {
          return function(hidden) {
            self.state.icons[iconId].hidden = hidden;
            var elem = document.getElementById(self.containerId + '-icon-' + iconId);
            if (elem) {
              elem.style.display = hidden ? 'none' : 'block';
            }
          };
        }(icon.id),
        
        // method to scale icon! uwu
        setScale: function(iconId) {
          return function(scale) {
            self.state.icons[iconId].scale = scale;
            self.updateIconTransform(iconId);  // use unified transform update! :3
          };
        }(icon.id),
        
        // method to rotate icon! (radians) >_<
        setRotation: function(iconId) {
          return function(radians) {
            self.state.icons[iconId].rotation = radians;
            self.updateIconTransform(iconId);  // use unified transform update! uwu
          };
        }(icon.id)
      };
    }
  }
  
  // helper to update icon transform (combines scale and rotation!) :333
  updateIconTransform(iconId) {
    var icon = this.state.icons[iconId];
    var elem = document.getElementById(this.containerId + '-icon-' + iconId);
    if (elem) {
      var rotation = (icon.rotation * 180 / Math.PI);  // convert radians to degrees for CSS uwu
      elem.style.transform = 'translate(-50%, -50%) scale(' + icon.scale + ') rotate(' + rotation + 'deg)';
    }
  }
  
  // build the UI with BOOMER MODE ACTIVATED >_<
  buildUI() {
    var container = document.getElementById(this.containerId);
    if (!container) {
      console.error('Container #' + this.containerId + ' not found! ;-;');
      return;
    }
    
    // create table (full boomer mode lol)
    var html = '<table border="1">';
    
    // title row :333
    html += '<tr><td colspan="2"><center><b>' + this.title + '</b></center></td></tr>';
    
    // canvas row uwu
    html += '<tr><td colspan="2">';
    html += '<div id="' + this.containerId + '-canvas-wrapper" style="position: relative; width: ' + this.canvasWidth + 'px; height: ' + this.canvasHeight + 'px;">';
    html += '<canvas id="' + this.containerId + '-canvas" width="' + this.canvasWidth + '" height="' + this.canvasHeight + '"></canvas>';
    html += '</div>';
    html += '</td></tr>';
    
    // input rows >_<
    var inputs = this.config.inputs || [];
    
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      html += '<tr><td>' + input.label + '</td><td>';
      
      if (input.type === 'slider') {
        // slider with disabled text input for value display uwu
        html += '<input type="range" id="' + this.containerId + '-' + input.id + '" ';
        html += 'min="' + input.min + '" max="' + input.max + '" ';
        html += 'step="' + (input.step || 0.1) + '" value="' + input.initial + '">';
        html += ' <input type="text" id="' + this.containerId + '-' + input.id + '-value" ';
        html += 'value="' + input.initial + '" size="5" disabled>';
      } else if (input.type === 'radio') {
        // radio buttons :3
        for (var j = 0; j < input.options.length; j++) {
          var opt = input.options[j];
          var checked = j === 0 ? 'checked' : '';
          html += '<input type="radio" name="' + this.containerId + '-' + input.id + '" ';
          html += 'value="' + opt[0] + '" id="' + this.containerId + '-' + input.id + '-' + j + '" ' + checked + '>';
          html += '<label for="' + this.containerId + '-' + input.id + '-' + j + '">' + opt[1] + '</label> ';
        }
      } else if (input.type === 'button') {
        // button uwu
        html += '<input type="button" id="' + this.containerId + '-' + input.id + '" ';
        html += 'value="' + input.label + '">';
      }
      
      html += '</td></tr>';
    }
    
    html += '</table>';
    container.innerHTML = html;
    
    // add draggable icons over canvas uwu
    this.addIcons();
  }
  
  // add emoji icons on top of canvas :333
  addIcons() {
    var wrapper = document.getElementById(this.containerId + '-canvas-wrapper');
    var icons = this.config.icons || [];
    
    for (var i = 0; i < icons.length; i++) {
      var icon = icons[i];
      var iconDiv = document.createElement('div');
      iconDiv.id = this.containerId + '-icon-' + icon.id;
      iconDiv.className = 'viz-icon';
      iconDiv.style.cssText = 'position: absolute; left: ' + icon.x + 'px; top: ' + icon.y + 'px; cursor: grab; user-select: none; text-align: center; transform: translate(-50%, -50%); font-size: 24px;';
      
      var labelHTML = icon.label ? '<div style="font-size: 10px; margin-top: -4px;">' + icon.label + '</div>' : '';
      iconDiv.innerHTML = '<div>' + icon.emoji + '</div>' + labelHTML;
      
      wrapper.appendChild(iconDiv);
    }
  }
  
  // setup all event listeners >_<
  setupEventListeners() {
    var inputs = this.config.inputs || [];
    var self = this;
    
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      
      if (input.type === 'slider') {
        // slider change events uwu
        var elem = document.getElementById(this.containerId + '-' + input.id);
        var valueElem = document.getElementById(this.containerId + '-' + input.id + '-value');
        
        elem.addEventListener('input', function(inputObj, valElem) {
          return function(e) {
            var value = parseFloat(e.target.value);
            self.state.inputs[inputObj.id] = value;
            valElem.value = value.toFixed(2);
            
            // call callback if exists :3
            if (inputObj.onChange) {
              inputObj.onChange(value, self.state);
            }
          };
        }(input, valueElem));
        
      } else if (input.type === 'radio') {
        // radio change events :333
        var radios = document.getElementsByName(this.containerId + '-' + input.id);
        
        for (var j = 0; j < radios.length; j++) {
          radios[j].addEventListener('change', function(inputObj) {
            return function(e) {
              var value = e.target.value;
              self.state.inputs[inputObj.id] = value;
              
              // call callback if exists uwu
              if (inputObj.onChange) {
                inputObj.onChange(value, self.state);
              }
            };
          }(input));
        }
        
      } else if (input.type === 'button') {
        // button click events >_<
        var btnElem = document.getElementById(this.containerId + '-' + input.id);
        
        btnElem.addEventListener('click', function(inputObj) {
          return function() {
            // call callback if exists :333
            if (inputObj.onClick) {
              inputObj.onClick(self.state);
            }
          };
        }(input));
      }
    }
    
    // icon drag events >_<
    this.setupIconDragging();
  }
  
  // make icons draggable! uwu
  setupIconDragging() {
    var icons = this.config.icons || [];
    var self = this;
    
    for (var i = 0; i < icons.length; i++) {
      var icon = icons[i];
      var iconElem = document.getElementById(this.containerId + '-icon-' + icon.id);
      if (!iconElem) continue;
      
      iconElem.addEventListener('mousedown', function(iconObj, elem) {
        var isDragging = false;
        var offsetX, offsetY;
        
        return function(e) {
          isDragging = true;
          self.draggedIcon = iconObj.id;
          self.isPaused = true; // pause simulation during drag! :3
          elem.style.cursor = 'grabbing';
          
          var rect = elem.getBoundingClientRect();
          offsetX = e.clientX - rect.left - rect.width / 2;
          offsetY = e.clientY - rect.top - rect.height / 2;
          
          e.preventDefault();
          
          // mousemove handler uwu
          var moveHandler = function(e) {
            if (!isDragging) return;
            
            var wrapper = document.getElementById(self.containerId + '-canvas-wrapper');
            var rect = wrapper.getBoundingClientRect();
            
            var x = e.clientX - rect.left - offsetX;
            var y = e.clientY - rect.top - offsetY;
            
            // clamp to canvas bounds uwu
            x = Math.max(0, Math.min(self.canvasWidth, x));
            y = Math.max(0, Math.min(self.canvasHeight, y));
            
            // call onDragMove callback for position validation/modification! :333
            if (iconObj.onDragMove) {
              var newPos = iconObj.onDragMove(x, y, self.state);
              if (newPos !== null && newPos !== undefined) {
                x = newPos.x;
                y = newPos.y;
              }
            }
            
            self.state.icons[iconObj.id].setPosition(x, y);
          };
          
          // mouseup handler :333
          var upHandler = function() {
            if (!isDragging) return;
            
            isDragging = false;
            elem.style.cursor = 'grab';
            
            // call drag callback! >_<
            if (iconObj.onDrag) {
              iconObj.onDrag(
                self.state.icons[iconObj.id].x,
                self.state.icons[iconObj.id].y,
                self.state
              );
            }
            
            self.isPaused = false; // resume simulation uwu
            self.draggedIcon = null;
            
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
          };
          
          document.addEventListener('mousemove', moveHandler);
          document.addEventListener('mouseup', upHandler);
        };
      }(icon, iconElem));
    }
  }
  
  // start the animation loop! uwu
  startAnimation() {
    var self = this;
    
    var animate = function(timestamp) {
      var deltaTime = timestamp - self.lastTime;
      self.lastTime = timestamp;
      
      // get canvas context :3
      var canvas = document.getElementById(self.containerId + '-canvas');
      var ctx = canvas.getContext('2d');
      
      // clear canvas uwu
      ctx.clearRect(0, 0, self.canvasWidth, self.canvasHeight);
      
      // call simulation tick if not paused >_<
      if (!self.isPaused && self.config.onSimulationTick) {
        self.config.onSimulationTick(self.state, deltaTime);
      }
      
      // call render callback :333
      if (self.config.render) {
        self.config.render(ctx, self.state);
      }
      
      self.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  // cleanup method uwu
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}