function onCreated(){
  if(browser.runtime.lastError){
    console.log(`Error: ${browser.runtime.lastError}`);
  } else{
    console.log("Context menu item created successfully")
  }
}

browser.contextMenus.create(
  {
    id: "2H2P",
    title: "2Human2Paste",
    contexts: ["all"],
  },
  onCreated,
);

browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "2H2P":
      console.log(info.selectionText);
      browser.tabs.sendMessage(tab.id, {action: "readClipboard" });
      break;
    //
  }
});

// Triggered when user clicks your extension or a context menu
browser.browserAction.onClicked.addListener(async (tab) => {
  browser.tabs.sendMessage(tab.id, { action: "readClipboard" });
});

browser.contextMenus.create(
  {
    id: "2H2P",
    title: browser.i18n.getMessage("2Human2Paste"),
    contexts: ["all"],
  },
  onCreated,
);

browser.contextMenus.create(
  {
    id: "2H2P-help",
    title: "2Human2Paste - Show Commands",
    contexts: ["all"],
  },
  onCreated,
);

browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "2H2P":
      console.log(info.selectionText);
      break;
    case "2H2P-help":
      browser.tabs.sendMessage(tab.id, { action: "showHelp" });
      break;
  }
});

browser.browserAction.onClicked.addListener(async (tab) => {
  browser.tabs.sendMessage(tab.id, { action: "readClipboard" });
});
