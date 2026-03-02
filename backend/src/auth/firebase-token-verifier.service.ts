import { Injectable, UnauthorizedException } from '@nestjs/common';

type FirebaseLookupUser = {
  localId?: string;
  email?: string;
  emailVerified?: boolean;
};

type FirebaseLookupResponse = {
  users?: FirebaseLookupUser[];
};

export type VerifiedFirebaseUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
};

@Injectable()
export class FirebaseTokenVerifierService {
  async verifyIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
    const apiKey = process.env.FIREBASE_WEB_API_KEY ?? process.env.VITE_FIREBASE_API_KEY ?? '';
    const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID ?? '';

    if (!apiKey || !projectId) {
      throw new UnauthorizedException('Login con Firebase no configurado');
    }

    const payload = this.decodeJwtPayload(idToken);
    if (!payload) {
      throw new UnauthorizedException('Token de Firebase invalido');
    }

    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    if (payload.aud !== projectId || payload.iss !== expectedIssuer) {
      throw new UnauthorizedException('Token de Firebase invalido para este proyecto');
    }

    const verified = await this.lookupTokenInFirebase(idToken, apiKey);
    const user = verified.users?.[0];
    if (!user?.localId) {
      throw new UnauthorizedException('No se pudo validar el token de Firebase');
    }

    return {
      uid: user.localId,
      email: user.email ?? null,
      emailVerified: Boolean(user.emailVerified),
    };
  }

  private decodeJwtPayload(idToken: string): { aud?: string; iss?: string } | null {
    const chunks = idToken.split('.');
    if (chunks.length < 2) return null;
    try {
      const payloadJson = Buffer.from(chunks[1], 'base64url').toString('utf8');
      return JSON.parse(payloadJson) as { aud?: string; iss?: string };
    } catch {
      return null;
    }
  }

  private async lookupTokenInFirebase(idToken: string, apiKey: string): Promise<FirebaseLookupResponse> {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Token de Firebase invalido o expirado');
    }

    return (await response.json()) as FirebaseLookupResponse;
  }
}
