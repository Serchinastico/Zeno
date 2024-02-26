import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, requestUrl } from "obsidian";
import { PromptModal } from "./components/promptModal";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: "default",
};

type ChatCompletionResponse = {
    id: string;
    object: "chat.completion";
    created: number;
    model: string;
    choices: { index: number; message: { role: string; content: string }; finish_reason: string }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
};

const improveText = async (text: string, prompt: string) => {
    const httpResponse = await requestUrl({
        url: "http://localhost:1234/v1/chat/completions",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "unused",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful AI writing assistant. You will follow user request to the letter and provide with helpful insights and feedback. You will use markdown to format your responses.",
                },
                {
                    role: "user",
                    content: `Hi, can you help me improve the following text? Just reply with the improved text verbamit. I want the text to ${prompt}. Here is the original text: "${text}"`,
                },
            ],
            temperature: 0.7,
            stream: false,
        }),
    });

    const jsonResponse: ChatCompletionResponse = httpResponse.json;
    const response = jsonResponse.choices[0]?.message.content ?? "";
    return response.replace(/^"|"$/g, "");
};

export default class MyPlugin extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        await this.loadSettings();

        // This creates an icon in the left ribbon.
        const ribbonIconEl = this.addRibbonIcon("dice", "Sample Plugin", async (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            try {
                const httpResponse = await requestUrl({
                    url: "http://localhost:1234/v1/chat/completions",
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "unused",
                        messages: [
                            { role: "system", content: "Always answer in rhymes." },
                            { role: "user", content: "Introduce yourself." },
                        ],
                        temperature: 0.7,
                        stream: false,
                    }),
                });

                const jsonResponse: ChatCompletionResponse = httpResponse.json;
                console.log("RESPONSE");
                console.log("--------------");
                console.log(JSON.stringify(jsonResponse, null, 2));
                new Notice(jsonResponse.choices[0]?.message.content ?? "");
            } catch (exception) {
                new Notice("ERROR");
                new Notice(exception, 10000);
                console.log("ERROR");
                console.log(exception);
            }
        });
        // Perform additional things with the ribbon
        ribbonIconEl.addClass("my-plugin-ribbon-class");

        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
        const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText("Status Bar Text");

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: "improve-text",
            name: "Improve text",
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const selection = editor.getSelection();

                const modal = new PromptModal({
                    app: this.app,
                    selectedText: selection,
                    onSubmit: async (prompt: string) => {
                        const response = await improveText(selection, prompt);
                        view.contentEl.createEl("h1", { text: "How do you want to change the text?" });
                        editor.replaceSelection(response);
                    },
                });
                modal.open();
            },
        });
        // This adds an editor command that can perform some operation on the current editor instance
        this.addCommand({
            id: "sample-editor-command",
            name: "Sample editor command",
            editorCallback: async (editor: Editor, view: MarkdownView) => {},
        });
        // This adds a complex command that can check whether the current state of the app allows execution of the command
        this.addCommand({
            id: "open-sample-modal-complex",
            name: "Open sample modal (complex)",
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.
                    if (!checking) {
                        new SampleModal(this.app).open();
                    }

                    // This command will only show up in Command Palette when the check function returns true
                    return true;
                }
            },
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));

        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        this.registerDomEvent(document, "click", (evt: MouseEvent) => {
            console.log("click", evt);
        });

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000));
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.setText("Woah!");
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Setting #1")
            .setDesc("It's a secret")
            .addText((text) =>
                text
                    .setPlaceholder("Enter your secret")
                    .setValue(this.plugin.settings.mySetting)
                    .onChange(async (value) => {
                        this.plugin.settings.mySetting = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
