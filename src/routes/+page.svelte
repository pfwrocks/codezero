<script lang="ts">
	import { PUBLIC_OPENAI_KEY } from '$env/static/public';
	import { javascript } from '@codemirror/lang-javascript';
	import OpenAI from 'openai';
	import CodeMirror from 'svelte-codemirror-editor';
	import { writable } from 'svelte/store';
	import { INIT_PROGRAM } from './program';
	import { SYSTEM_PROMPT, generateUserPrompt } from './prompt';

	let value = INIT_PROGRAM;
	let isDisabled = false;
	let logs = writable([]);

	// never do this, should always be run server-side. For demo only
	const openai = new OpenAI({
		apiKey: PUBLIC_OPENAI_KEY,
		dangerouslyAllowBrowser: true
	});

	async function create() {
		isDisabled = true;
		try {
			const response = await openai.chat.completions.create({
				model: 'gpt-4-turbo-2024-04-09',
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					{ role: 'user', content: generateUserPrompt(value) }
				]
			});
			value = response.choices[0].message.content
				? response.choices[0].message.content.replace(/^```javascript\n?/, '').replace(/```$/, '')
				: `// error generating code \n\n ${value}`;
		} catch (error) {
			console.error('Error generating code: ', error);
			value = `// error generating code \n\n ${value}`;
		} finally {
			isDisabled = false;
			runGeneratedCode();
		}
	}

	function runGeneratedCode(): void {
		const originalConsoleLog: typeof console.log = console.log;
		try {
			// Temporarily store the original console.log
			let capturedLogs: string[] = [];

			// Override console.log to capture logs instead
			console.log = (...args: any[]): void => {
				capturedLogs.push(
					args
						.map((arg) => {
							if (typeof arg === 'object') {
								return JSON.stringify(arg, null, 2);
							}
							return arg.toString();
						})
						.join(' ')
				);
			};

			// Run the user-generated function
			const func: Function = new Function('console', value);
			func({ log: (...args: any[]) => console.log(...args) }); // Pass the overridden console.log

			// Restore the original console.log after execution
			console.log = originalConsoleLog;

			// Update the logs store
			logs.set(capturedLogs as unknown as never[]);
		} catch (error: unknown) {
			// Restore original console.log in case of an error
			console.log = originalConsoleLog;
			console.error('Error executing script: ', error);
		}
	}
</script>

<h1>Coding's Final Frontier Prototype</h1>
<p>Write some JS/pseudocode and then click generate full code.</p>
<button on:click={create}> {isDisabled ? 'Generating...' : 'Generate Full Code'} </button>
<CodeMirror bind:value lang={javascript()} on:change={runGeneratedCode} readonly={isDisabled} />

<p>Output:</p>
{#each $logs as log, i (i)}
	<pre>{log}</pre>
{/each}
