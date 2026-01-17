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
      icons: {}
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
    if (this.config.callbacks?.onInit) {
      this.config.callbacks.onInit(this.state);
    }
    
    // start the render loop! :333
    this.startAnimation();
  }
  
  // setup initial input values >_<
  initInputs() {
    const inputs = this.config.inputs || {};
    
    // sliders uwu
    if (inputs.sliders) {
      inputs.sliders.forEach(slider => {
        this.state.inputs[slider.id] = slider.initial;
      });
    }
    
    // radio buttons :3
    if (inputs.radios) {
      inputs.radios.forEach(radio => {
        this.state.inputs[radio.id] = radio.options[0][0]; // first option's id
      });
    }
  }
  
  // setup initial icon positions uwu
  initIcons() {
    const icons = this.config.icons || [];
    icons.forEach(icon => {
      this.state.icons[icon.id] = {
        x: icon.x,
        y: icon.y,
        emoji: icon.emoji,
        label: icon.label
      };
    });
  }
  
  // build the UI with BOOMER MODE ACTIVATED >_<
  buildUI() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container #${this.containerId} not found! ;-;`);
      return;
    }
    
    // create table (full boomer mode lol)
    let html = '<table border="1" style="border-collapse: collapse;">';
    
    // title row :333
    html += `<tr><td colspan="2" style="text-align: center; padding: 8px; font-weight: bold;">
      ${this.title}
    </td></tr>`;
    
    // canvas row uwu
    html += `<tr><td colspan="2" style="padding: 0; position: relative;">
      <div id="${this.containerId}-canvas-wrapper" style="position: relative; width: ${this.canvasWidth}px; height: ${this.canvasHeight}px;">
        <canvas id="${this.containerId}-canvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
      </div>
    </td></tr>`;
    
    // input rows >_<
    const inputs = this.config.inputs || {};
    
    // sliders uwu
    if (inputs.sliders) {
      inputs.sliders.forEach(slider => {
        html += `<tr>
          <td style="padding: 8px;">${slider.label}</td>
          <td style="padding: 8px;">
            <input type="range" id="${this.containerId}-${slider.id}" 
              min="${slider.min}" max="${slider.max}" 
              step="${slider.step || 0.1}" value="${slider.initial}"
              style="width: 150px;">
            <span id="${this.containerId}-${slider.id}-value">${slider.initial}</span>
          </td>
        </tr>`;
      });
    }
    
    // radio buttons :3
    if (inputs.radios) {
      inputs.radios.forEach(radio => {
        let radioHTML = '';
        radio.options.forEach(([id, label]) => {
          const checked = id === radio.options[0][0] ? 'checked' : '';
          radioHTML += `
            <label style="margin-right: 10px;">
              <input type="radio" name="${this.containerId}-${radio.id}" 
                value="${id}" ${checked}>
              ${label}
            </label>
          `;
        });
        html += `<tr>
          <td style="padding: 8px;">${radio.label}</td>
          <td style="padding: 8px;">${radioHTML}</td>
        </tr>`;
      });
    }
    
    html += '</table>';
    container.innerHTML = html;
    
    // add draggable icons over canvas uwu
    this.addIcons();
  }
  
  // add emoji icons on top of canvas :333
  addIcons() {
    const wrapper = document.getElementById(`${this.containerId}-canvas-wrapper`);
    const icons = this.config.icons || [];
    
    icons.forEach(icon => {
      const iconDiv = document.createElement('div');
      iconDiv.id = `${this.containerId}-icon-${icon.id}`;
      iconDiv.className = 'viz-icon';
      iconDiv.style.cssText = `
        position: absolute;
        left: ${icon.x}px;
        top: ${icon.y}px;
        cursor: grab;
        user-select: none;
        text-align: center;
        transform: translate(-50%, -50%);
      `;
      
      iconDiv.innerHTML = `
        <div style="font-size: 24px;">${icon.emoji}</div>
        ${icon.label ? `<div style="font-size: 10px; margin-top: -4px;">${icon.label}</div>` : ''}
      `;
      
      wrapper.appendChild(iconDiv);
    });
  }
  
  // setup all event listeners >_<
  setupEventListeners() {
    const inputs = this.config.inputs || {};
    
    // slider change events uwu
    if (inputs.sliders) {
      inputs.sliders.forEach(slider => {
        const elem = document.getElementById(`${this.containerId}-${slider.id}`);
        const valueElem = document.getElementById(`${this.containerId}-${slider.id}-value`);
        
        elem.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          this.state.inputs[slider.id] = value;
          valueElem.textContent = value.toFixed(2);
          
          // call callback if exists :3
          if (this.config.callbacks?.onInputChange) {
            this.config.callbacks.onInputChange(slider.id, value, this.state);
          }
        });
      });
    }
    
    // radio change events :333
    if (inputs.radios) {
      inputs.radios.forEach(radio => {
        const radios = document.getElementsByName(`${this.containerId}-${radio.id}`);
        radios.forEach(elem => {
          elem.addEventListener('change', (e) => {
            const value = e.target.value;
            this.state.inputs[radio.id] = value;
            
            // call callback if exists uwu
            if (this.config.callbacks?.onInputChange) {
              this.config.callbacks.onInputChange(radio.id, value, this.state);
            }
          });
        });
      });
    }
    
    // icon drag events >_<
    this.setupIconDragging();
  }
  
  // make icons draggable! uwu
  setupIconDragging() {
    const icons = this.config.icons || [];
    
    icons.forEach(icon => {
      const iconElem = document.getElementById(`${this.containerId}-icon-${icon.id}`);
      if (!iconElem) return;
      
      let isDragging = false;
      let offsetX, offsetY;
      
      iconElem.addEventListener('mousedown', (e) => {
        isDragging = true;
        this.draggedIcon = icon.id;
        this.isPaused = true; // pause simulation during drag! :3
        iconElem.style.cursor = 'grabbing';
        
        const rect = iconElem.getBoundingClientRect();
        const parentRect = iconElem.parentElement.getBoundingClientRect();
        offsetX = e.clientX - rect.left - rect.width / 2;
        offsetY = e.clientY - rect.top - rect.height / 2;
        
        e.preventDefault();
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isDragging || this.draggedIcon !== icon.id) return;
        
        const wrapper = document.getElementById(`${this.containerId}-canvas-wrapper`);
        const rect = wrapper.getBoundingClientRect();
        
        let x = e.clientX - rect.left - offsetX;
        let y = e.clientY - rect.top - offsetY;
        
        // clamp to canvas bounds uwu
        x = Math.max(0, Math.min(this.canvasWidth, x));
        y = Math.max(0, Math.min(this.canvasHeight, y));
        
        iconElem.style.left = x + 'px';
        iconElem.style.top = y + 'px';
        
        this.state.icons[icon.id].x = x;
        this.state.icons[icon.id].y = y;
      });
      
      document.addEventListener('mouseup', () => {
        if (!isDragging || this.draggedIcon !== icon.id) return;
        
        isDragging = false;
        iconElem.style.cursor = 'grab';
        
        // call drag callback! :333
        if (this.config.callbacks?.onIconDrag) {
          this.config.callbacks.onIconDrag(
            icon.id,
            this.state.icons[icon.id].x,
            this.state.icons[icon.id].y,
            this.state
          );
        }
        
        this.isPaused = false; // resume simulation >_<
        this.draggedIcon = null;
      });
    });
  }
  
  // start the animation loop! uwu
  startAnimation() {
    const animate = (timestamp) => {
      const deltaTime = timestamp - this.lastTime;
      this.lastTime = timestamp;
      
      // get canvas context :3
      const canvas = document.getElementById(`${this.containerId}-canvas`);
      const ctx = canvas.getContext('2d');
      
      // clear canvas uwu
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      // call simulation tick if not paused >_<
      if (!this.isPaused && this.config.callbacks?.onSimulationTick) {
        this.config.callbacks.onSimulationTick(this.state, deltaTime);
      }
      
      // call render callback :333
      if (this.config.callbacks?.render) {
        this.config.callbacks.render(ctx, this.state);
      }
      
      this.animationId = requestAnimationFrame(animate);
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