console.log("Content script loaded!");

let targetElement = null;
let isTyping = false;
let shouldStop = false;

// Track which element is right-clicked
document.addEventListener('contextmenu', (e) => {
  targetElement = e.target;
  console.log("Right-clicked on:", targetElement);
}, true);

// Listen for Escape key to stop typing
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isTyping) {
    console.log("Typing interrupted by user!");
    shouldStop = true;
  }
}, true);

// Supporting function to determine element type and editability
function getElementInfo(element) {
  if (!element) {
    return { 
      type: null, 
      subtype: null, 
      isEditable: false 
    };
  }
  
  if (element.tagName === 'INPUT') {
    return {
      type: 'input',
      subtype: element.type, // 'text', 'email', 'password', etc.
      isEditable: true
    };
  }
  
  if (element.tagName === 'TEXTAREA') {
    return {
      type: 'textarea',
      subtype: null,
      isEditable: true
    };
  }
  
  if (element.isContentEditable) {
    return {
      type: 'contenteditable',
      subtype: element.tagName, // 'DIV', 'SPAN', etc.
      isEditable: true
    };
  }
  
  return {
    type: 'not-editable',
    subtype: element.tagName,
    isEditable: false
  };
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  
  if (request.action === "readClipboard") {
    console.log("Reading clipboard...");
    
    // Stop any existing typing
    if (isTyping) {
      console.log("Stopping previous typing session...");
      shouldStop = true;
      // Wait a bit before starting new typing
      setTimeout(() => {
        shouldStop = false;
        startTyping();
      }, 100);
    } else {
      startTyping();
    }
    
    function startTyping() {
      navigator.clipboard.readText().then(text => {
        console.log("Clipboard text:", text);
        
        // Get element information
        const elementInfo = getElementInfo(targetElement);
        console.log("Element info:", elementInfo);
        
        if (elementInfo.isEditable) {
          targetElement.focus();
          isTyping = true;
          shouldStop = false;
          typeLikeHuman(text, targetElement, elementInfo);
        } else {
          console.error("Target is not an editable field:", targetElement);
          console.error("Element type:", elementInfo.type);
        }
        
        sendResponse({ clipboardText: text });
      }).catch(error => {
        console.error("Clipboard error:", error);
      });
    }
    
    return true;
  }
  
  if (request.action === "showHelp") {
    showHelpOverlay();
    sendResponse({ success: true });
    return true;
  }
});

function typeLikeHuman(text, element, elementInfo, index = 0) {
  // Check if we should stop
  if (shouldStop) {
    console.log("Typing stopped by user at character", index);
    isTyping = false;
    shouldStop = false;
    return;
  }
  
  if (index >= text.length) {
    console.log("Finished typing!");
    isTyping = false;
    return;
  }
  
  const char = text[index];
  console.log(`Typing character ${index}: '${char}' into ${elementInfo.type}`);
  
  const keydownEvent = new KeyboardEvent('keydown', {
    key: char,
    bubbles: true,
    cancelable: true
  });
  
  const keypressEvent = new KeyboardEvent('keypress', {
    key: char,
    bubbles: true,
    cancelable: true
  });
  
  const keyupEvent = new KeyboardEvent('keyup', {
    key: char,
    bubbles: true,
    cancelable: true
  });
  
  element.dispatchEvent(keydownEvent);
  element.dispatchEvent(keypressEvent);
  
  // Handle different element types
  if (elementInfo.type === 'input' || elementInfo.type === 'textarea') {
    element.value += char;
  } else if (elementInfo.type === 'contenteditable') {
    document.execCommand('insertText', false, char);
  }
  
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(keyupEvent);
  
  const delay = (Math.random() * (300 - 100)) + 100;
  setTimeout(() => typeLikeHuman(text, element, elementInfo, index + 1), delay);
}

function showHelpOverlay() {
  // Remove existing overlay if present
  const existing = document.getElementById('2h2p-help-overlay');
  if (existing) {
    existing.remove();
    return;
  }
  
  const overlay = document.createElement('div');
  overlay.id = '2h2p-help-overlay';
  overlay.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 999999; display: flex; align-items: center; justify-content: center;" id="2h2p-overlay-bg">
      <div style="background: white; padding: 25px; border-radius: 8px; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
        <h2 style="margin-top: 0; color: #333;">2Human2Paste Commands</h2>
        
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; color: #0066cc; margin-bottom: 5px;">Click Extension Icon</div>
          <div style="color: #666; font-size: 14px;">Reads clipboard and pastes with human-like typing into the active field.</div>
        </div>
        
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; color: #0066cc; margin-bottom: 5px;">Press ESC</div>
          <div style="color: #666; font-size: 14px;">Stop the current typing simulation.</div>
        </div>
        
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; color: #0066cc; margin-bottom: 5px;">Right-click → Show Commands</div>
          <div style="color: #666; font-size: 14px;">Display this help menu.</div>
        </div>
        
        <div style="margin-bottom: 0;">
          <div style="font-weight: bold; color: #0066cc; margin-bottom: 5px;">Typing Speed</div>
          <div style="color: #666; font-size: 14px;">Random delays between 100-300ms to mimic natural typing.</div>
        </div>
        
        <button id="2h2p-close-btn" style="margin-top: 20px; padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Close on background click or button click
  document.getElementById('2h2p-overlay-bg').addEventListener('click', (e) => {
    if (e.target.id === '2h2p-overlay-bg' || e.target.id === '2h2p-close-btn') {
      overlay.remove();
    }
  });
}