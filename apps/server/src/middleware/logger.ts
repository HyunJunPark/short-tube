import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // 전체 URL 구성
    const fullUrl = `${req.method} ${req.originalUrl || req.url}`;
    const statusCode = res.statusCode;
    const statusText = statusCode >= 400 ? '❌' : '✅';
    
    // 기본 로그
    const baseLog = `${statusText} ${fullUrl} ${statusCode} - ${duration}ms`;
    
    // 쿼리 파라미터 로깅
    const queryString = Object.keys(req.query).length > 0 
      ? `\n    📋 Query params: ${JSON.stringify(req.query)}`
      : '';
    
    // 요청 본문 로깅 (POST, PUT, PATCH)
    let bodyString = '';
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      // 민감한 정보 마스킹
      const body = { ...req.body };
      if (body.password) body.password = '***';
      if (body.telegram_token) body.telegram_token = '***';
      if (body.telegram_chat_id) body.telegram_chat_id = '***';
      bodyString = `\n    📦 Body: ${JSON.stringify(body)}`;
    }
    
    // 경로 파라미터 로깅
    const paramsString = Object.keys(req.params).length > 0
      ? `\n    🔗 Path params: ${JSON.stringify(req.params)}`
      : '';
    
    const fullLog = baseLog + queryString + bodyString + paramsString;

    if (statusCode >= 400) {
      console.error(fullLog);
    } else {
      console.log(fullLog);
    }
  });

  next();
};
