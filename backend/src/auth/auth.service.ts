import { HttpService } from '@nestjs/axios';
import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';


type Carrera = { codigo: string; nombre: string; catalogo: string };
type User = { rut: string; email: string; password: string; carreras: Carrera[] };

const demoUsers: User[] = [
    {
        rut: '333333333',
        email: 'juan@example.com',
        password: '123456',
        carreras: [{ codigo: '8606', nombre: 'ICCI', catalogo: '201610' }],
    },
    {
        rut: '222222222',
        email: 'maria@example.com',
        password: 'abcdef',
        carreras: [{ codigo: '8266', nombre: 'ITI', catalogo: '202410' }],
    },
    {
        rut: '111111111',
        email: 'ximena@example.com',
        password: 'qwerty',
        carreras: [{ codigo: '8606', nombre: 'ICCI', catalogo: '201610' }],
    },
];
export interface LoginResponse {
    rut: string;
    carreras: Carrera[];
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(private readonly http: HttpService) { }
    private async callUpstream<T>(obs: Observable<AxiosResponse<T>>): Promise<T> {
        try {
            const res = await firstValueFrom(obs);
            return res.data;
        } catch (err: unknown) {
            const e = err as AxiosError<unknown>;
            const status = e.response?.status ?? 502;
            const payload = e.response?.data ?? { message: 'upstream error' };

            this.logger.warn('ucn request fallo', {
                status,
                hasData: Boolean(e.response?.data),
            });

            throw new HttpException(
                typeof payload === 'string' ? { message: payload } : (payload as object),
                status,
            );
        }
    }
    forgot(body: { rut?: string; email?: string }) {
        const useStubs: boolean = process.env.USE_STUBS === 'true';
        if (useStubs) {
            const user = demoUsers.find((u) => u.rut === body.rut && u.email.toLowerCase() === body.email);
            if (!user) throw new BadRequestException('rut o email no coinciden');
            return { ok: true, message: 'se envio un correo temporal' };
        }
    }

    async login(email: string, password: string): Promise<LoginResponse> {
        const useStubs: boolean = process.env.USE_STUBS === 'true';
        if (useStubs) {
            const user = demoUsers.find((u) => (u.email === email || u.rut === email) && u.password === password);
            if (!user) throw new BadRequestException('credenciales invalidas');
            return { rut: user.rut, carreras: user.carreras };
        }

        const url = `${process.env.UCN_BASE_PUCLARO}/login.php?email=${encodeURIComponent(
            email,
        )}&password=${encodeURIComponent(password)}`;

        // usa el helper y tipa la respuesta esperada
        const data = await this.callUpstream<LoginResponse>(
            this.http.get<LoginResponse>(url),
        );

        // valida/mapear la respuesta antes de devolverla
        if (!data?.rut) {
            this.logger.warn('ucn login: respuesta sin rut', { data });
            throw new HttpException({ message: 'respuesta invalida desde UCN' }, 502);
        }

        return { rut: data.rut, carreras: data.carreras ?? [] };
    }


}


