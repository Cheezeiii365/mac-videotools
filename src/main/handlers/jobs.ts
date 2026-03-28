import { IpcMain } from 'electron';
import { IpcChannel } from '../../shared/types';

type CancelHandler = () => void | Promise<void>;

const cancelHandlers = new Map<string, CancelHandler>();

export function registerJobCancellation(jobId: string, handler: CancelHandler) {
  cancelHandlers.set(jobId, handler);
}

export function unregisterJobCancellation(jobId: string) {
  cancelHandlers.delete(jobId);
}

export function registerJobHandlers(ipcMain: IpcMain) {
  ipcMain.handle(IpcChannel.CANCEL_JOB, async (_event, jobId: string) => {
    const handler = cancelHandlers.get(jobId);
    if (!handler) {
      return false;
    }

    cancelHandlers.delete(jobId);
    await handler();
    return true;
  });
}
