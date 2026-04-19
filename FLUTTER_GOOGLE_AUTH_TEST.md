# Flutter Google Auth Test

الملف ده معمول كمرجع سريع علشان نحدد المشكلة جاية من Flutter ولا من الباك إند.

## المطلوب في Flutter

أضف الباكدجات التالية:

```yaml
dependencies:
  google_sign_in: ^6.3.0
  dio: ^5.7.0
```

## كود تشخيص سريع

انسخ الكود التالي داخل أي `StatefulWidget` أو داخل service مؤقت للتجربة:

```dart
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

class GoogleAuthDebugService {
  GoogleAuthDebugService({
    Dio? dio,
  }) : _dio = dio ?? Dio();

  static const String webClientId =
      '862356448705-ef58p8agverpmeggh7tidmnbg8ql3f6b.apps.googleusercontent.com';

  static const String backendBaseUrl = 'http://10.0.2.2:3001/api';

  final Dio _dio;

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: webClientId,
    scopes: <String>[
      'email',
      'profile',
      'openid',
    ],
  );

  Future<void> runFullDebug() async {
    await _googleSignIn.signOut();

    final GoogleSignInAccount? user = await _googleSignIn.signIn();
    if (user == null) {
      debugPrint('Google sign-in cancelled by user');
      return;
    }

    final GoogleSignInAuthentication auth = await user.authentication;
    final String? idToken = auth.idToken;
    final String? accessToken = auth.accessToken;
    final String? serverAuthCode = user.serverAuthCode;

    debugPrint('Google account email: ${user.email}');
    debugPrint('Google account id: ${user.id}');
    debugPrint('idToken exists: ${idToken != null && idToken.isNotEmpty}');
    debugPrint('accessToken exists: ${accessToken != null && accessToken.isNotEmpty}');
    debugPrint('serverAuthCode: $serverAuthCode');

    if (idToken != null && idToken.isNotEmpty) {
      final payload = _decodeJwtPayload(idToken);
      debugPrint('Decoded idToken payload: ${jsonEncode(payload)}');
    }

    if (idToken != null && idToken.isNotEmpty) {
      await _testLegacyIdTokenFlow(idToken);
    } else {
      debugPrint('Skipping /auth/mobile because idToken is null');
    }

    if (serverAuthCode != null && serverAuthCode.isNotEmpty) {
      await _testServerAuthCodeFlow(serverAuthCode);
    } else {
      debugPrint('Skipping /auth/mobile/auth-code because serverAuthCode is null');
    }
  }

  Future<void> _testLegacyIdTokenFlow(String idToken) async {
    try {
      final response = await _dio.post(
        '$backendBaseUrl/auth/mobile',
        data: <String, dynamic>{
          'idToken': idToken,
        },
      );

      debugPrint('Legacy idToken flow success: ${response.data}');
    } on DioException catch (error) {
      debugPrint('Legacy idToken flow failed: ${error.response?.statusCode}');
      debugPrint('Legacy idToken flow body: ${error.response?.data}');
    }
  }

  Future<void> _testServerAuthCodeFlow(String serverAuthCode) async {
    try {
      final response = await _dio.post(
        '$backendBaseUrl/auth/mobile/auth-code',
        data: <String, dynamic>{
          'serverAuthCode': serverAuthCode,
        },
      );

      debugPrint('Server auth code flow success: ${response.data}');
    } on DioException catch (error) {
      debugPrint('Server auth code flow failed: ${error.response?.statusCode}');
      debugPrint('Server auth code flow body: ${error.response?.data}');
    }
  }

  Map<String, dynamic> _decodeJwtPayload(String token) {
    final List<String> parts = token.split('.');
    if (parts.length != 3) {
      throw Exception('Invalid JWT format');
    }

    final String normalized = base64Url.normalize(parts[1]);
    final String payload = utf8.decode(base64Url.decode(normalized));
    return jsonDecode(payload) as Map<String, dynamic>;
  }
}
```

## طريقة الاستخدام

مثال سريع داخل زر:

```dart
final debugService = GoogleAuthDebugService();

ElevatedButton(
  onPressed: () async {
    await debugService.runFullDebug();
  },
  child: const Text('Test Google Auth'),
)
```

## ماذا تتوقع في اللوج

لو المشكلة من Flutter أو Google SDK:

- `idToken` يكون `null`
- أو `serverAuthCode` يكون `null`
- أو `Decoded idToken payload` يطلع `aud` غير مطابق
- أو `/auth/mobile` يفشل بينما `/auth/mobile/auth-code` ينجح

لو المشكلة من الباك إند:

- Flutter يطبع `idToken` و`serverAuthCode` بشكل سليم
- ويفشل endpoint الجديد والقديم بنفس البيانات مع رسالة راجعة من السيرفر

## تفسير النتائج بسرعة

- لو `serverAuthCode` ينجح و`idToken` يفشل:
  مشكلة الفلو القديم في Flutter غالبًا كانت في إرسال أو استخراج `idToken`.

- لو `serverAuthCode` نفسه `null`:
  إعداد Google Sign-In في Flutter ليس مهيأ لاستخراج server auth code.

- لو endpoint الجديد يرجع `401 Invalid or expired Google auth code`:
  جرّب كود جديد فورًا، لأن `serverAuthCode` يستخدم مرة واحدة فقط.

## ملاحظات مهمة

- غيّر `backendBaseUrl` حسب البيئة عندك.
- على Android emulator استخدم `10.0.2.2` بدل `localhost`.
- على جهاز حقيقي استخدم IP الجهاز الذي يشغّل الباك إند.
- لا تستخدم `accessToken` بدل `idToken`.
- لا تعيد استخدام نفس `serverAuthCode` مرتين.
