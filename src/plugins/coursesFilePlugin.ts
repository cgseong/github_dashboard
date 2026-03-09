// Vite 플러그인 - 수업 설정을 로컬 JSON 파일에 저장/불러오기
// 별도 서버 없이 Vite 개발 서버의 미들웨어로 동작
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

// 데이터 파일 경로 (프로젝트 루트/data/courses.json)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');

/** 데이터 디렉토리 및 파일 초기화 */
function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(COURSES_FILE)) {
        fs.writeFileSync(COURSES_FILE, '[]', 'utf-8');
    }
}

/** 수업 목록 읽기 */
function readCourses(): unknown[] {
    ensureDataFile();
    try {
        const json = fs.readFileSync(COURSES_FILE, 'utf-8');
        return JSON.parse(json);
    } catch {
        return [];
    }
}

/** 수업 목록 저장 */
function writeCourses(courses: unknown[]) {
    ensureDataFile();
    fs.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2), 'utf-8');
}

/** 요청 바디를 파싱하는 유틸리티 */
function parseBody(req: import('http').IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

/** Vite 플러그인: 수업 설정 파일 저장/불러오기 API */
export default function coursesFilePlugin(): Plugin {
    return {
        name: 'courses-file-api',
        configureServer(server) {
            // GET /api/courses - 수업 목록 조회
            server.middlewares.use('/api/courses', async (req, res, next) => {
                // GET: 수업 목록 조회
                if (req.method === 'GET') {
                    const courses = readCourses();
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, data: courses }));
                    return;
                }

                // PUT: 수업 목록 전체 저장
                if (req.method === 'PUT') {
                    try {
                        const body = await parseBody(req);
                        const courses = JSON.parse(body);
                        if (!Array.isArray(courses)) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ success: false, error: '배열 형식이어야 합니다.' }));
                            return;
                        }
                        writeCourses(courses);
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, data: courses }));
                    } catch {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ success: false, error: '저장 중 오류 발생' }));
                    }
                    return;
                }

                next();
            });

            console.log('📁 수업 설정 파일 API 활성화: data/courses.json');
        },
    };
}
