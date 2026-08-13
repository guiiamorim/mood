import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const UUID = 'mood@local';

function commandPath() {
    const local = GLib.build_filenamev([GLib.get_home_dir(), '.local', 'bin', 'mood']);
    if (GLib.file_test(local, GLib.FileTest.IS_EXECUTABLE))
        return local;
    return GLib.find_program_in_path('mood') ?? local;
}

const MoodToggle = GObject.registerClass(
class MoodToggle extends QuickSettings.QuickMenuToggle {
    _init() {
        super._init({
            title: 'mood',
            subtitle: 'Carregando…',
            iconName: 'preferences-desktop-wallpaper-symbolic',
            toggleMode: false,
        });
        this._busy = false;
        this.menu.setHeader('preferences-desktop-wallpaper-symbolic', 'mood', 'Wallpaper adaptativo');
        this._topicSection = new PopupMenu.PopupMenuSection();
        this._schemeSection = new PopupMenu.PopupMenuSection();
        this.menu.addAction('Trocar wallpaper agora', () => this._run(['next']));
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(new PopupMenu.PopupMenuItem('Tópico'));
        this.menu.addMenuItem(this._topicSection);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(new PopupMenu.PopupMenuItem('Esquema de cores'));
        this.menu.addMenuItem(this._schemeSection);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addAction('Sortear próximo tópico', () => this._run(['set-topic', 'random']));
        this.menu.addAction('Atualizar status', () => this._refresh());
        this._refresh();
    }

    _setBusy(busy) {
        this._busy = busy;
        this.menu.sensitive = !busy;
        this.sensitive = !busy;
        this.subtitle = busy ? 'Buscando…' : this.subtitle;
    }

    _run(args, refresh = true) {
        if (this._busy)
            return;
        const proc = Gio.Subprocess.new([commandPath(), ...args], Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
        this._setBusy(true);
        proc.communicate_utf8_async(null, null, (source, result) => {
            let output = '';
            let error = '';
            try {
                const [, stdout, stderr] = source.communicate_utf8_finish(result);
                output = stdout ?? '';
                error = stderr ?? '';
            } catch (e) {
                error = e.message;
            }
            const ok = source.get_successful();
            if (!ok && error)
                Main.notify('mood', error.trim().split('\n').pop());
            else if (args[0] !== 'status')
                Main.notify('mood', 'Operação concluída');
            this._setBusy(false);
            if (refresh)
                this._refresh(output);
        });
    }

    _parseStatus(text) {
        const status = {};
        for (const line of text.split('\n')) {
            const index = line.indexOf('=');
            if (index > 0)
                status[line.slice(0, index)] = line.slice(index + 1);
        }
        return status;
    }

    _refresh(initialOutput = null) {
        if (initialOutput !== null) {
            this._render(this._parseStatus(initialOutput));
            return;
        }
        const proc = Gio.Subprocess.new([commandPath(), 'status'], Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
        proc.communicate_utf8_async(null, null, (source, result) => {
            try {
                const [, stdout] = source.communicate_utf8_finish(result);
                this._render(this._parseStatus(stdout ?? ''));
            } catch (e) {
                this.subtitle = 'Indisponível';
            }
        });
    }

    _render(status) {
        const topic = status.topic || 'sem tópico';
        const scheme = status.scheme || 'auto';
        const operation = status.operation || 'idle';
        this.subtitle = `${scheme === 'light' ? 'Claro' : scheme === 'dark' ? 'Escuro' : 'Auto'} · ${operation}`;
        this._topicSection.removeAll();
        const topics = [
            'dreamlike surreal landscapes',
            'minimalist architecture',
            'cinematic neon city',
            'outer space nebulae',
            'moody forest atmosphere',
            'abstract color geometry',
            'macro nature textures',
            'quiet coastal horizons',
        ];
        for (const itemTopic of topics) {
            const item = new PopupMenu.PopupMenuItem(itemTopic);
            if (itemTopic === topic)
                item.setOrnament(PopupMenu.Ornament.CHECK);
            item.connect('activate', () => this._run(['set-topic', itemTopic]));
            this._topicSection.addMenuItem(item);
        }
        this._schemeSection.removeAll();
        const schemes = [['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Escuro']];
        for (const [value, label] of schemes) {
            const item = new PopupMenu.PopupMenuItem(label);
            if (value === scheme)
                item.setOrnament(PopupMenu.Ornament.CHECK);
            item.connect('activate', () => this._run(['set-scheme', value]));
            this._schemeSection.addMenuItem(item);
        }
    }

    destroy() {
        this._topicSection?.destroy();
        this._schemeSection?.destroy();
        super.destroy();
    }
});

export default class MoodExtension extends Extension {
    enable() {
        this._indicator = new QuickSettings.SystemIndicator();
        this._indicator._icon = this._indicator._addIndicator();
        this._indicator._icon.icon_name = 'preferences-desktop-wallpaper-symbolic';
        this._toggle = new MoodToggle();
        this._indicator.quickSettingsItems.push(this._toggle);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        this._toggle?.destroy();
        this._toggle = null;
        this._indicator?.destroy();
        this._indicator = null;
    }
}

