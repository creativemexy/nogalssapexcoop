import 'package:flutter/material.dart';

class ApplyLoanScreen extends StatelessWidget {
  const ApplyLoanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Apply Loan')),
      body: const Center(child: Text('Apply Loan Screen')),
    );
  }
}