import { App, Modal, Setting } from "obsidian";

interface Props {
    app: App;
    selectedText: string;
    onSubmit: (result: string) => void;
}

export class PromptModal extends Modal {
    result: string;
    selectedText: string;
    onSubmit: (prompt: string) => void;

    constructor({ app, selectedText, onSubmit }: Props) {
        super(app);
        this.selectedText = selectedText;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        this.setTitle("Improve text");

        new Setting(this.contentEl)
            .setName("Prompt")
            .setDesc("How do you want to improve the selection?")
            .addTextArea((text) => {
                text.inputEl.focus();

                text.onChange((value) => {
                    this.result = value;
                });
            })
            .addButton((btn) =>
                btn
                    .setButtonText("Submit")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onSubmit(this.result);
                    })
            );

        this.contentEl.createEl("div", { text: "Selected text", cls: "strong" });
        this.contentEl.createEl("blockquote", {
            text: `“${this.selectedText}”`,
            cls: "border-s-4 border-gray-300 italic",
        });
    }

    onClose() {
        this.contentEl.empty();
    }
}
