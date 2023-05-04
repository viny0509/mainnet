import { CronJob, CronCommand } from 'cron'
export default abstract class CronjobService {
  private _instance: CronJob

  constructor(cronTime: string | Date) {
    this._instance = new CronJob(cronTime, this.onTick())
  }

  public start(): void {
    this._instance.start()
  }

  protected abstract onTick(): CronCommand
}
