import { ConsoleLogger, LoggerService } from '@nestjs/common';

const LOGS_AMOUNT = 50;

export class MyLogger extends ConsoleLogger implements LoggerService {
  #logs = [];

  log(message: any, ...optionalParams: any[]) {
    // @ts-ignore
    super.log(...arguments);
    this.#addLog('log', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    // @ts-ignore
    super.error(...arguments);
    this.#addLog('error', message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    // @ts-ignore
    super.warn(...arguments);
  }

  debug(message: any, ...optionalParams: any[]) {
    // @ts-ignore
    super.debug(...arguments);
  }

  verbose(message: any, ...optionalParams: any[]) {
    // @ts-ignore
    super.verbose(...arguments);
  }

  #addLog(type: 'log' | 'error', message: any, ...optionalParams: any[]) {
    const datetime = `<span class="l-time">${new Date().toLocaleString()}</span>`;

    if (
      optionalParams?.length &&
      Array.isArray(optionalParams[0]) &&
      optionalParams[0].length > 1
    ) {
      optionalParams = [optionalParams[0].at(-1)];
    }

    const optional = `<span class="l-optional">[${optionalParams.join()}]</span>`;
    const _message = `<span class="l-message l-${type}">${message}</span>`;

    this.#logs.push(
      `${datetime} - ${type.toUpperCase()} - ${optional} | ${_message}`,
    );

    if (this.#logs.length > LOGS_AMOUNT) {
      this.#logs.splice(0, 1);
    }
  }

  getLogs() {
    return this.#logs;
  }
}
