import { Response } from "express";

export function streamWriteData(res: any, data: any) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  if (res.flush) res.flush();
}
