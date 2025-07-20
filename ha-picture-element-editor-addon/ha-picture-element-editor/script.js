$(document).ready(function () {
  let elements = [];
  let editor;
  let currentEditingIndex = null;
  let modal;


  // Setup CodeMirror YAML editor
  editor = CodeMirror.fromTextArea($('#yaml-input')[0], {
    mode: 'yaml',
    lineNumbers: true,
    theme: 'default'
  });

  // Setup CodeMirror for output (readonly)
  let outputEditor = CodeMirror.fromTextArea($('#output')[0], {
    mode: 'yaml',
    lineNumbers: true,
    theme: 'default',
    readOnly: true
  });

  // Restore from localStorage
  const cachedYaml = localStorage.getItem('yaml') || '';
  const cachedDomain = localStorage.getItem('domain') || '';
  editor.setValue(cachedYaml);
  $('#ha-domain').val(cachedDomain);

  editor.on('change', () => {
    localStorage.setItem('yaml', editor.getValue());
  });

  $('#ha-domain').on('input', function () {
    localStorage.setItem('domain', $(this).val());
  });

  modal = new bootstrap.Modal($('#elementModal')[0]);

  // Modal form submit handler
  $('#element-form').on('submit', function (e) {
    e.preventDefault();
    if (currentEditingIndex === null) return;

    const type = $('#input-type').val().trim();
    const entity = $('#input-entity').val().trim();
    const top = $('#input-top').val().trim();
    const left = $('#input-left').val().trim();

    // Update elements array
    elements[currentEditingIndex].type = type;
    elements[currentEditingIndex].entity = entity;
    elements[currentEditingIndex].style.top = top;
    elements[currentEditingIndex].style.left = left;

    // Update draggable element position and label
    const container = $('#image-container')[0];
    const draggableDivs = $(container).find('.draggable');
    const div = draggableDivs[currentEditingIndex];
    let w = $(div).outerWidth();
    let h = $(div).outerHeight();
    // Set position so center is at (left, top)
    $(div).css({ top: `calc(${top} - ${h/2}px)`, left: `calc(${left} - ${w/2}px)` });

    // Update tooltip
    // Update simple-tooltip text
    $(div).find('.simple-tooltip').text(entity || 'No entity');

    modal.hide();
  });

  const outputTab = $('#tab-output-tab')[0];
  if (outputTab) {
    $(outputTab).on('shown.bs.tab', function () {
      window.generateYAML();
    });
  }

  // Load YAML button logic
  window.loadYAML = function () {
    const yamlText = editor.getValue();
    const domain = $('#ha-domain').val().trim().replace(/\/$/, '');

    let doc;
    try {
      doc = jsyaml.load(yamlText);
    } catch (e) {
      alert('Invalid YAML: ' + e.message);
      return;
    }

    if (!doc || !Array.isArray(doc.elements)) {
      alert('YAML must include a "elements:" list.');
      return;
    }

    // Switch to Picture Elements tab
    const tabTrigger = $('#tab-picture-elements-tab')[0];
    if (tabTrigger) {
      const tab = new bootstrap.Tab(tabTrigger);
      tab.show();
    }

    elements = doc.elements;

    // Resolve image path
    let imgSrc = doc.image || '';
    if (imgSrc.startsWith('/')) {
      if (!domain) {
        alert('Relative image path used. Please provide Home Assistant domain.');
        return;
      }
      imgSrc = domain + imgSrc;
    }

    $('#picture-elements').attr('src', imgSrc);

    // Remove existing draggable elements
    $('.draggable, .image-draggable').remove();

    const container = $('#image-container');

    let justDragged = false;

    // Smart guides options
    var opts = {
      containment: 'parent',
      smartGuides: true,
      appendGuideTo: '.drag:not(".selected")',
      snapTolerance: 10,
      beforeStart: function () {
        var $this = $(this);
        if (!$this.hasClass('selected')) {
          $this.siblings('.selected').removeClass('selected');
          $this.addClass('selected');
        }
      }
    };

    elements.forEach((el, index) => {
      let div = $('<div></div>');
      div.css({ position: 'absolute' });
      div.attr('data-index', index);
      div.addClass('draggable drag');

      let width = 56, height = 56;
      let isImage = (el.type === 'image' && el.state_image);
      if (isImage) {
        div.addClass('image-draggable');
        const firstState = Object.keys(el.state_image)[0];
        let imgSrc = el.state_image[firstState];
        if (imgSrc.startsWith('/')) {
          if (domain) {
            imgSrc = domain + imgSrc;
          }
        }
        const img = $('<img />');
        img.attr('src', imgSrc);
        img.attr('alt', el.title || el.entity || '');
        img.on('load', function() {
          let w = img[0].naturalWidth;
          let h = img[0].naturalHeight;
          if (el.style?.left && el.style?.top) {
            div.css({
              left: `calc(${el.style.left} - ${w/2}px)`,
              top: `calc(${el.style.top} - ${h/2}px)`
            });
          }
        });
        div.append(img);
      } else {
        div.text(index + 1);
        const label = $('<span></span>');
        label.addClass('badge-label');
        label.text('X');
        div.append(label);
        if (el.style?.left && el.style?.top) {
          div.css({
            left: `calc(${el.style.left} - 28px)`,
            top: `calc(${el.style.top} - 28px)`
          });
        }
      }
      // Add simple HTML tooltip
      const tooltip = $('<span class="simple-tooltip"></span>');
      tooltip.text(el.entity || 'No entity');
      div.append(tooltip);
      // Remove Bootstrap tooltip logic for draggable elements
      div.removeAttr('data-bs-title');
      div.on('click', function () {
        if (justDragged) {
          justDragged = false;
          return;
        }
        currentEditingIndex = index;
        $('#input-type').val(el.type || '');
        $('#input-entity').val(el.entity || '');
        let $div = $(this);
        let w = $div.outerWidth();
        let h = $div.outerHeight();
        let left = parseFloat($div.css('left')) + w/2;
        let top = parseFloat($div.css('top')) + h/2;
        $('#input-top').val(top + 'px');
        $('#input-left').val(left + 'px');
        modal.show();
      });
      container.append(div);
    });

    // Initialize draggable for all .drag elements (no resizable)
    $('#image-container .drag').draggable(Object.assign({}, opts, {
      start: function (event, ui) {
        $(this).addClass('dragging');
      },
      stop: function (event, ui) {
        justDragged = true;
        const idx = parseInt($(this).attr('data-index'));
        const pictureElements = $('#picture-elements');
        const rect = pictureElements[0].getBoundingClientRect();
        let $this = $(this);
        let w = $this.outerWidth();
        let h = $this.outerHeight();
        const x = ((ui.position.left - pictureElements.position().left) + w/2) / rect.width * 100;
        const y = ((ui.position.top - pictureElements.position().top) + h/2) / rect.height * 100;
        if (!isNaN(idx) && elements[idx]) {
          elements[idx].style.left = x.toFixed(1) + '%';
          elements[idx].style.top = y.toFixed(1) + '%';
        }
        $(this).removeClass('dragging');
      }
    }));
  };

  // Generate YAML button logic
  window.generateYAML = function () {
    const domain = $('#ha-domain').val().trim().replace(/\/$/, '');
    const fullImage = $('#picture-elements').attr('src');
    let image = fullImage;
    if (domain && fullImage.startsWith(domain)) {
      image = fullImage.replace(domain, '');
    }
    const outputYaml = jsyaml.dump({
      type: 'picture-elements',
      image: image,
      elements: elements
    });
    $('#output').val(outputYaml);
    if (outputEditor) {
      outputEditor.setValue(outputYaml);
    }
    localStorage.setItem('yaml', outputYaml);
  };

  // Attach click handler for Load Elements button
  $('#load-elements-btn').on('click', window.loadYAML);

  // Attach click handler for Generate YAML button
  $('#generate-yaml-btn').on('click', window.generateYAML);

  // Auto-load elements when Picture Elements tab is shown if not already loaded
  const pictureElementsTab = $('#tab-picture-elements-tab');
  if (pictureElementsTab.length) {
    pictureElementsTab.on('shown.bs.tab', function () {
      if (elements.length === 0) {
        window.loadYAML();
      }
    });
  }
}); 